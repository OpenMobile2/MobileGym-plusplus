import { useCtripStore } from '@/apps/Ctrip/state';
import type { Hotel } from '@/apps/Ctrip/types';
import { routeStationMatches, SEARCHABLE_CITIES, resolveSearchKeyword } from '@/apps/Ctrip/utils/searchCity';
import {
  assertAllowedKeys, optionalEnum, optionalInteger, optionalString, ToolExecutionError,
} from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { CTRIP_TOOL_DEFINITIONS } from './definitions';

const HOTEL_PRICE_RANGES = [
  { id: 'lt150', label: '¥150以下', min: 0, max: 149 },
  { id: '150-300', label: '¥150-300', min: 150, max: 300 },
  { id: '300-450', label: '¥300-450', min: 300, max: 450 },
  { id: 'lt400', label: '¥400以下', min: 0, max: 400 },
  { id: '450-600', label: '¥450-600', min: 450, max: 600 },
  { id: 'gt600', label: '¥600以上', min: 600, max: 99999 },
] as const;

const HOTEL_CHIPS = ['徒步', '玩转乐园', '亲子', '地铁周边', '含早'] as const;
const PRICE_IDS = HOTEL_PRICE_RANGES.map((row) => row.id);

const state = () => useCtripStore.getState();
const hotelById = (id: string): Hotel => requireFound(
  state().hotels.find((item) => item.id === id), 'HOTEL_NOT_FOUND', `Ctrip hotel not found: ${id}`,
);
const hotelSummary = (hotel: Hotel) => ({
  hotel_id: hotel.id, name: hotel.name, city: hotel.city, district: hotel.district,
  star: hotel.star, score: hotel.score, review_count: hotel.reviewCount,
  starting_price: hotel.price, facilities: hotel.facilities, tags: hotel.tags,
  room_price_min: hotel.rooms.length ? Math.min(...hotel.rooms.map((room) => room.price)) : null,
  favorite: state().favoriteHotels.includes(hotel.id),
});

function optionalStringList(input: JsonObject, key: string): string[] {
  const value = input[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be an array of strings.`);
  }
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function optionalBool(input: JsonObject, key: string): boolean | undefined {
  if (!(key in input) || input[key] === undefined || input[key] === null) return undefined;
  if (typeof input[key] !== 'boolean') {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a boolean.`);
  }
  return input[key] as boolean;
}

function citiesMentioned(text: string): string[] {
  const found: string[] = [];
  for (const city of SEARCHABLE_CITIES) {
    if (text.includes(city) && !found.includes(city)) found.push(city);
  }
  return found;
}

function parseHotelFilters(input: JsonObject, query: string) {
  const city = optionalString(input, 'city', { maxLength: 40 })
    ?? citiesMentioned(query)[0]
    ?? undefined;
  const explicitPrice = optionalString(input, 'price_id', { maxLength: 20 });
  const priceId = explicitPrice && PRICE_IDS.includes(explicitPrice as typeof PRICE_IDS[number])
    ? explicitPrice
    : /400\s*元?\s*以下|¥\s*400\s*以下|lt400/.test(query) ? 'lt400'
      : /150\s*元?\s*以下/.test(query) ? 'lt150'
        : undefined;
  if (explicitPrice && !priceId) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"price_id" must be one of: ${PRICE_IDS.join(', ')}.`);
  }
  const requestedChips = optionalStringList(input, 'chips');
  const chips = [
    ...requestedChips,
    ...HOTEL_CHIPS.filter((chip) => query.includes(chip) && !requestedChips.includes(chip)),
  ];
  const unknownChip = chips.find((chip) => !HOTEL_CHIPS.includes(chip as typeof HOTEL_CHIPS[number]));
  if (unknownChip) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"chips" contains unknown chip: ${unknownChip}.`);
  }
  return { city, priceId, chips, keyword: resolveSearchKeyword(query, city ?? '') };
}

function applyHotelFilters(hotels: Hotel[], city: string | undefined, keyword: string, priceId: string | undefined, chips: string[]) {
  const hayOf = (hotel: Hotel) => `${hotel.name} ${hotel.district} ${hotel.tags.join(' ')} ${hotel.facilities.join(' ')}`;
  let rows = city ? hotels.filter((hotel) => hotel.city === city) : hotels;
  if (keyword) {
    const tokens = keyword.split(/\s+/).filter(Boolean);
    const match = (hotel: Hotel) => {
      const hay = hayOf(hotel);
      return tokens.every((token) => hay.includes(token)) || tokens.some((token) => hay.includes(token));
    };
    const hits = rows.filter(match);
    rows = hits.length > 0 ? hits : hotels.filter(match);
  }
  if (priceId) {
    const range = HOTEL_PRICE_RANGES.find((row) => row.id === priceId);
    if (range) rows = rows.filter((hotel) => hotel.price >= range.min && hotel.price <= range.max);
  }
  for (const chip of chips) {
    if (chip === '含早') {
      rows = rows.filter((hotel) => hotel.tags.some((tag) => tag.includes(chip)) || hotel.rooms.some((room) => !/无早餐/.test(room.breakfast)));
    } else {
      rows = rows.filter((hotel) => hotel.tags.some((tag) => tag.includes(chip) || chip.includes(tag.slice(0, 2))));
    }
  }
  return rows;
}

const handlers: Record<string, ToolHandler> = {
  ctrip__search_hotels: (input) => {
    assertAllowedKeys(input, ['query', 'limit', 'city', 'price_id', 'chips']);
    const query = getQuery(input);
    const { city, priceId, chips, keyword } = parseHotelFilters(input, query);
    const rows = applyHotelFilters(state().hotels, city, keyword || query, priceId, chips);
    if (priceId || chips.length > 0) {
      state().recordTaskAudit('hotelFilters', {
        city: city ?? rows[0]?.city ?? null,
        keyword,
        priceId: priceId ?? null,
        chips,
        moreTag: null,
        sort: 'popularity',
      });
    }
    return compactResult(rows.map(hotelSummary), getLimit(input, 50));
  },
  ctrip__get_hotel_summary: (input) => {
    assertAllowedKeys(input, ['hotel_id']);
    const hotel = hotelById(getQuery(input, 'hotel_id'));
    const reviews = (state().hotelReviews[hotel.id] ?? []).slice(0, 8).map((review) => ({
      review_id: review.id,
      user: review.user,
      score: review.score,
      date: review.date,
      content: review.content,
    }));
    state().recordTaskAudit(`hotelFacilities:${hotel.id}`, true);
    state().recordTaskAudit(`hotelReviewsViewed:${hotel.id}`, true);
    return { ...hotelSummary(hotel), reviews };
  },
  ctrip__search_trains: (input) => {
    assertAllowedKeys(input, ['query', 'from', 'to', 'limit']);
    const query = optionalString(input, 'query', { maxLength: 200 });
    const from = optionalString(input, 'from', { maxLength: 200 });
    const to = optionalString(input, 'to', { maxLength: 200 });
    if (!query && !from && !to) {
      throw new ToolExecutionError(
        'INVALID_ARGUMENT',
        'Provide from and to for a route, or query for a train number or type.',
      );
    }
    const rows = state().trains.filter((train) => {
      if (from && !routeStationMatches(train.from, from)) return false;
      if (to && !routeStationMatches(train.to, to)) return false;
      if (query && !includesQuery([train.trainNo, train.from, train.to, train.type, train.id], query)) return false;
      return true;
    }).map((train) => ({
      train_id: train.id, train_no: train.trainNo, from: train.from, to: train.to,
      depart: train.depart, arrive: train.arrive, duration: train.duration, type: train.type,
      seats: train.seats.map((seat) => ({ name: seat.name, price: seat.price, status: seat.status })),
      stops: train.stops.map((stop) => ({
        station: stop.station, arrive: stop.arrive, depart: stop.depart, stay: stop.stay,
      })),
    }));
    rows.sort((a, b) => a.depart.localeCompare(b.depart));
    if (query) {
      const exact = state().trains.find((train) => (
        train.trainNo.toLowerCase() === query.toLowerCase() || train.id === query
      ));
      if (exact) state().recordTaskAudit(`trainStopsViewed:${exact.id}`, true);
    }
    return compactResult(rows, optionalInteger(input, 'limit', { min: 1, max: 80, defaultValue: 80 }));
  },
  ctrip__search_flights: (input) => {
    assertAllowedKeys(input, ['query', 'from', 'to', 'direct_only', 'limit']);
    const query = optionalString(input, 'query', { maxLength: 200 }) ?? '';
    const mentioned = citiesMentioned(query);
    const from = optionalString(input, 'from', { maxLength: 200 }) ?? mentioned[0];
    const to = optionalString(input, 'to', { maxLength: 200 }) ?? mentioned[1];
    if (!query && !from && !to) {
      throw new ToolExecutionError(
        'INVALID_ARGUMENT',
        'Provide from and to for a route, or query for a flight number or city.',
      );
    }
    const directOnly = optionalBool(input, 'direct_only') ?? /直飞/.test(query);
    const queryNeedle = query.replace(/直飞/g, ' ').replace(/\s+/g, ' ').trim();
    const rows = state().flights.filter((flight) => {
      if (from && !routeStationMatches(flight.from, from)) return false;
      if (to && !routeStationMatches(flight.to, to)) return false;
      if (directOnly && flight.transfer) return false;
      if (!queryNeedle) return true;
      if (from || to) {
        return !/^[A-Z0-9]{2,8}$/i.test(queryNeedle)
          || includesQuery([flight.flightNo], queryNeedle);
      }
      return includesQuery([
        flight.flightNo, flight.airline, flight.from, flight.to, flight.fromAirport, flight.toAirport,
      ], queryNeedle);
    }).map((flight) => ({
      flight_id: flight.id, flight_no: flight.flightNo, airline: flight.airline,
      from: flight.from, to: flight.to, from_airport: flight.fromAirport, to_airport: flight.toAirport,
      depart: flight.depart, arrive: flight.arrive, duration: flight.duration,
      transfer: flight.transfer, price: flight.price, cabin: flight.cabin, pet_friendly: flight.petFriendly ?? false,
    }));
    if (directOnly && from && to) {
      state().recordTaskAudit('flightDirectOnly', { from, to, enabled: true });
    }
    return compactResult(rows, getLimit(input, 50));
  },
  ctrip__search_attractions: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const rows = state().attractions.filter((item) => includesQuery([
      item.name, item.district, ...item.tags,
    ], query)).map((item) => ({
      attraction_id: item.id, name: item.name, district: item.district, score: item.score,
      open_time: item.openTime, tags: item.tags,
      ticket_price_min: item.ticketTypes.length ? Math.min(...item.ticketTypes.map((ticket) => ticket.price)) : null,
    }));
    return compactResult(rows, getLimit(input, 50));
  },
  ctrip__list_orders: (input) => {
    assertAllowedKeys(input, ['limit']);
    return compactResult(state().orders.map((order) => ({
      order_id: order.id, category: order.category, title: order.title, subtitle: order.subtitle,
      date: order.date, status: order.status, status_text: order.statusText, price: order.price,
    })), getLimit(input, 50));
  },
  ctrip__open_hotel: async (input) => {
    assertAllowedKeys(input, ['hotel_id', 'section']);
    const hotel = hotelById(getQuery(input, 'hotel_id'));
    const section = optionalEnum(input, 'section', ['detail', 'facilities', 'reviews'] as const, 'detail');
    const route = section === 'facilities'
      ? `/hotel/${encodeURIComponent(hotel.id)}/facilities`
      : section === 'reviews'
        ? `/hotel/${encodeURIComponent(hotel.id)}/review`
        : `/hotel/${encodeURIComponent(hotel.id)}`;
    if (section === 'facilities') state().recordTaskAudit(`hotelFacilities:${hotel.id}`, true);
    if (section === 'reviews') state().recordTaskAudit(`hotelReviewsViewed:${hotel.id}`, true);
    await openAppRoute('ctrip', route);
    return { route, hotel_id: hotel.id, section };
  },
  ctrip__open_orders: async () => {
    await openAppRoute('ctrip', '/orders');
    return { route: '/orders' };
  },
};

export function executeCtripTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Ctrip tool: ${name}`)(input);
}

export { CTRIP_TOOL_DEFINITIONS } from './definitions';
