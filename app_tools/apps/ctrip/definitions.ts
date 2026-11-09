import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const CTRIP_TOOL_DEFINITIONS = defineAppTools('ctrip', [
  { name: 'search_hotels', description: 'Search known hotels by name, city, district, facilities, or tags. Optional city / price_id / chips match the GUI list filters and write the same hotelFilters audit. Returns compact candidates; inspect rooms and policies in the GUI.', properties: {
    query: STRING,
    limit: LIMIT,
    city: { type: 'string', description: 'Hotel city, such as 杭州 or 上海' },
    price_id: { type: 'string', enum: ['lt150', '150-300', '300-450', 'lt400', '450-600', 'gt600'] },
    chips: { type: 'array', items: { type: 'string', enum: ['徒步', '玩转乐园', '亲子', '地铁周边', '含早'] } },
  }, required: ['query'] },
  { name: 'get_hotel_summary', description: 'Return compact hotel metadata, facilities, room price range, and a short review sample without booking. This is the same inspection as opening 设施 and 点评, and writes those audits.', properties: { hotel_id: ID }, required: ['hotel_id'] },
  { name: 'search_trains', description: 'Search trains by origin and destination, or by train number / type. Date is not a parameter; inspect a travel date in the GUI. Returns seat availability and stops. Querying an exact train number writes the same trainStopsViewed audit as opening 经停.', properties: {
    from: { type: 'string', description: 'Origin city or station' },
    to: { type: 'string', description: 'Destination city or station' },
    query: { type: 'string', description: 'Train number or type, such as G986 or 高铁' },
    limit: LIMIT,
  } },
  { name: 'search_flights', description: 'Search known flights by flight number, airline, origin, destination, or airport. Optional from/to/direct_only match the GUI route + 仅看直飞 filter and write flightDirectOnly.', properties: {
    query: STRING,
    from: { type: 'string', description: 'Origin city or airport' },
    to: { type: 'string', description: 'Destination city or airport' },
    direct_only: { type: 'boolean', description: 'Keep non-transfer flights only, the same as GUI 仅看直飞' },
    limit: LIMIT,
  } },
  { name: 'search_attractions', description: 'Search known attractions by name, district, or tags and return ticket price summaries.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'list_orders', description: 'List compact summaries of the user’s travel orders. This is read-only and does not cancel or pay an order.', properties: { limit: LIMIT } },
  { name: 'open_hotel', description: 'Open the hotel detail, facilities, or reviews page. section=facilities|reviews writes the same audits as those GUI pages. A fresh screenshot should be read after this call.', properties: {
    hotel_id: ID,
    section: { type: 'string', enum: ['detail', 'facilities', 'reviews'], description: 'detail is the hotel page; facilities and reviews match 设施 / 点评' },
  }, required: ['hotel_id'], kind: 'navigation' },
  { name: 'open_orders', description: 'Open the normal Ctrip orders page. Any cancellation, refund, or payment must be completed through the GUI.', kind: 'navigation' },
]);
