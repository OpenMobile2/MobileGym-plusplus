import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const CTRIP_TOOL_DEFINITIONS = defineAppTools('ctrip', [
  { name: 'search_hotels', description: 'Search known hotels by name, city, district, facilities, or tags. Returns compact candidates; inspect rooms and policies in the GUI.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'get_hotel_summary', description: 'Return compact hotel metadata, facilities, and room price range without booking.', properties: { hotel_id: ID }, required: ['hotel_id'] },
  { name: 'search_trains', description: 'Search known trains by train number, origin, destination, or train type. Returns seat availability summaries.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'search_flights', description: 'Search known flights by flight number, airline, origin, destination, or airport.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'search_attractions', description: 'Search known attractions by name, district, or tags and return ticket price summaries.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'list_orders', description: 'List compact summaries of the user’s travel orders. This is read-only and does not cancel or pay an order.', properties: { limit: LIMIT } },
  { name: 'open_hotel', description: 'Open the normal hotel detail page for visual inspection and GUI room selection. A fresh screenshot should be read after this call.', properties: { hotel_id: ID }, required: ['hotel_id'], kind: 'navigation' },
  { name: 'open_orders', description: 'Open the normal Ctrip orders page. Any cancellation, refund, or payment must be completed through the GUI.', kind: 'navigation' },
]);
