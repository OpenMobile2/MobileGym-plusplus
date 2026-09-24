import { useCtripStore } from '@/apps/Ctrip/state';
import type { Hotel } from '@/apps/Ctrip/types';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { CTRIP_TOOL_DEFINITIONS } from './definitions';

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

const handlers: Record<string, ToolHandler> = {
  ctrip__search_hotels: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    return compactResult(state().hotels.filter((hotel) => includesQuery([
      hotel.name, hotel.city, hotel.district, ...hotel.tags, ...hotel.facilities,
    ], query)).map(hotelSummary), getLimit(input, 50));
  },
  ctrip__get_hotel_summary: (input) => {
    assertAllowedKeys(input, ['hotel_id']);
    return hotelSummary(hotelById(getQuery(input, 'hotel_id')));
  },
  ctrip__search_trains: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const rows = state().trains.filter((train) => includesQuery([
      train.trainNo, train.from, train.to, train.type,
    ], query)).map((train) => ({
      train_id: train.id, train_no: train.trainNo, from: train.from, to: train.to,
      depart: train.depart, arrive: train.arrive, duration: train.duration, type: train.type,
      seats: train.seats.map((seat) => ({ name: seat.name, price: seat.price, status: seat.status })),
    }));
    return compactResult(rows, getLimit(input, 50));
  },
  ctrip__search_flights: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const rows = state().flights.filter((flight) => includesQuery([
      flight.flightNo, flight.airline, flight.from, flight.to, flight.fromAirport, flight.toAirport,
    ], query)).map((flight) => ({
      flight_id: flight.id, flight_no: flight.flightNo, airline: flight.airline,
      from: flight.from, to: flight.to, from_airport: flight.fromAirport, to_airport: flight.toAirport,
      depart: flight.depart, arrive: flight.arrive, duration: flight.duration,
      transfer: flight.transfer, price: flight.price, cabin: flight.cabin, pet_friendly: flight.petFriendly ?? false,
    }));
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
    assertAllowedKeys(input, ['hotel_id']);
    const hotel = hotelById(getQuery(input, 'hotel_id'));
    const route = `/hotel/${encodeURIComponent(hotel.id)}`;
    await openAppRoute('ctrip', route);
    return { route, hotel_id: hotel.id };
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
