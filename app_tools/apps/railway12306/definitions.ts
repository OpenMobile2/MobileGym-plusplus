import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const RAILWAY12306_TOOL_DEFINITIONS = defineAppTools('railway12306', [
  { name: 'search_stations', description: 'Search railway stations by name, pinyin, or station code.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'query_trains', description: 'Query direct trains for a route and date. Returns schedules and compact seat availability.', properties: { from: STRING, to: STRING, date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, limit: LIMIT }, required: ['from', 'to', 'date'] },
  { name: 'query_transfer_plans', description: 'Query train transfer candidates for a route and date.', properties: { from: STRING, to: STRING, date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, limit: LIMIT }, required: ['from', 'to', 'date'] },
  { name: 'get_train_summary', description: 'Return one train from the most recent query by train number.', properties: { train_no: STRING }, required: ['train_no'] },
  { name: 'list_orders', description: 'List compact railway order summaries, optionally filtered by status.', properties: { status: { type: 'string', enum: ['all', 'completed', 'pending', 'cancelled'], default: 'all' }, limit: LIMIT } },
  { name: 'get_order_summary', description: 'Return itinerary, passenger names, seats, and total for one railway order.', properties: { order_id: ID }, required: ['order_id'] },
  { name: 'list_passengers', description: 'List saved passengers with masked identity numbers.' },
  { name: 'get_account_summary', description: 'Return non-secret railway account and membership information.' },
  { name: 'open_query_form', description: 'Open the railway query form with origin, destination, and date prefilled. Run the search through the GUI.', properties: { from: STRING, to: STRING, date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, student: { type: 'boolean', default: false } }, required: ['from', 'to', 'date'], kind: 'draft' },
  { name: 'open_query_results', description: 'Execute a direct train query and open the normal result page for GUI filtering and selection.', properties: { from: STRING, to: STRING, date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }, required: ['from', 'to', 'date'], kind: 'navigation' },
  { name: 'open_order', description: 'Open an existing railway order detail page.', properties: { order_id: ID }, required: ['order_id'], kind: 'navigation' },
  { name: 'open_passengers', description: 'Open the saved-passenger list.', kind: 'navigation' },
  { name: 'open_train_for_booking', description: 'Open the latest query result and identify a train for GUI seat and passenger selection. This does not submit or pay.', properties: { train_no: STRING }, required: ['train_no'], kind: 'navigation' },
  { name: 'open_invoice', description: 'Open the railway invoice page. Invoice creation and submission remain GUI operations.', kind: 'navigation' },
]);
