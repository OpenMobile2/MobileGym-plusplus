import { useRailwayStore } from '@/apps/Railway12306/state';
import { initStations, searchStationsRemote } from '@/apps/Railway12306/services/stationService';
import { queryDirectTrains, queryTransferPlans } from '@/apps/Railway12306/services/trainService';
import type { TrainInfo } from '@/apps/Railway12306/types';
import { assertAllowedKeys, optionalBoolean, optionalEnum } from '../../core/errors';
import { compactResult, getLimit, getQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { RAILWAY12306_TOOL_DEFINITIONS } from './definitions';

const trainSummary = (t: TrainInfo) => ({
  train_no: t.trainNo, from: t.fromStation, to: t.toStation, departure: t.departTime,
  arrival: t.arriveTime, duration: t.duration, next_day: t.nextDay, tags: t.tags,
  seats: t.seats.map((s) => ({ type: s.type, available: s.count === Infinity ? 'many' : s.count, price: s.price, waitlist: s.canWaitlist })),
});
function setQuery(from: string, to: string, date: string, student = false) {
  const store = useRailwayStore.getState(); store.setFrom(from); store.setTo(to); store.setDate(date); store.setIsStudent(student);
}
let latestDirectTrains: TrainInfo[] = [];
function order(id: string) { return requireFound(useRailwayStore.getState().orders.find((o) => o.id === id), 'ORDER_NOT_FOUND', `Railway order not found: ${id}`); }

const handlers: Record<string, ToolHandler> = {
  railway12306__search_stations: async (input) => {
    assertAllowedKeys(input, ['query', 'limit']); await initStations(); const limit = getLimit(input, 50);
    return compactResult(searchStationsRemote(getQuery(input)).slice(0, limit).map((s) => ({ name: s.name, station_code: s.code, pinyin: s.pinyin })), limit);
  },
  railway12306__query_trains: async (input) => {
    assertAllowedKeys(input, ['from', 'to', 'date', 'limit']); const from = getQuery(input, 'from'); const to = getQuery(input, 'to'); const date = getQuery(input, 'date'); const limit = getLimit(input, 50);
    const trains = (await queryDirectTrains(from, to, date)).trains; latestDirectTrains = trains;
    return { from, to, date, ...compactResult(trains.map(trainSummary), limit) };
  },
  railway12306__query_transfer_plans: async (input) => {
    assertAllowedKeys(input, ['from', 'to', 'date', 'limit']); const from = getQuery(input, 'from'); const to = getQuery(input, 'to'); const date = getQuery(input, 'date'); const limit = getLimit(input, 30);
    const plans = await queryTransferPlans(from, to, date);
    return { from, to, date, ...compactResult(plans.map((p) => ({ transfer_station: p.transferStation, total_duration: p.totalDuration, first_train: p.leg1.trainNo, second_train: p.leg2.trainNo, first_departure: p.leg1.departTime, final_arrival: p.leg2.arriveTime })), limit) };
  },
  railway12306__get_train_summary: (input) => { assertAllowedKeys(input, ['train_no']); const no = getQuery(input, 'train_no'); return trainSummary(requireFound(latestDirectTrains.find((t) => t.trainNo.toLowerCase() === no.toLowerCase()), 'TRAIN_NOT_FOUND', `Train not found in latest query: ${no}`)); },
  railway12306__list_orders: (input) => {
    assertAllowedKeys(input, ['status', 'limit']); const status = optionalEnum(input, 'status', ['all', 'completed', 'pending', 'cancelled'] as const, 'all'); const limit = getLimit(input);
    const rows = useRailwayStore.getState().orders.filter((o) => status === 'all' || o.status === status).map((o) => ({ order_id: o.id, train_no: o.trainNo, from: o.fromStation, to: o.toStation, date: o.date, status: o.status, passenger_count: o.tickets.length, total: o.tickets.reduce((n, t) => n + t.price, 0) }));
    return { status, ...compactResult(rows, limit) };
  },
  railway12306__get_order_summary: (input) => { assertAllowedKeys(input, ['order_id']); const o = order(getQuery(input, 'order_id')); return { order_id: o.id, train_no: o.trainNo, from: o.fromStation, to: o.toStation, date: o.date, departure: o.departTime, arrival: o.arriveTime, status: o.status, tickets: o.tickets.map((t) => ({ passenger: t.passengerName, ticket_type: t.ticketType, seat_type: t.seatType, seat_no: t.seatNo, price: t.price })), total: o.tickets.reduce((n, t) => n + t.price, 0) }; },
  railway12306__list_passengers: () => ({ passengers: useRailwayStore.getState().passengers.map((p) => ({ passenger_id: p.id, name: p.name, id_type: p.idType, id_number_masked: `${p.idNo.slice(0, 3)}***********${p.idNo.slice(-4)}`, ticket_type: p.ticketType, is_default: p.isDefault })) }),
  railway12306__get_account_summary: () => { const s = useRailwayStore.getState(); return { logged_in: s.isLoggedIn, name: s.userProfile.name, username: s.loginUser?.username, phone_masked: s.loginUser?.phone ? `${s.loginUser.phone.slice(0, 3)}****${s.loginUser.phone.slice(-4)}` : undefined }; },
  railway12306__open_query_form: async (input) => { assertAllowedKeys(input, ['from', 'to', 'date', 'student']); const from = getQuery(input, 'from'); const to = getQuery(input, 'to'); const date = getQuery(input, 'date'); const student = optionalBoolean(input, 'student', false); setQuery(from, to, date, student); await openAppRoute('railway12306', '/'); return { route: '/', persisted: false, from, to, date, student }; },
  railway12306__open_query_results: async (input) => { assertAllowedKeys(input, ['from', 'to', 'date']); const from = getQuery(input, 'from'); const to = getQuery(input, 'to'); const date = getQuery(input, 'date'); setQuery(from, to, date); await useRailwayStore.getState().executeQuery(); latestDirectTrains = useRailwayStore.getState().directTrains; await openAppRoute('railway12306', '/query-result'); return { route: '/query-result', result_count: latestDirectTrains.length, trains: latestDirectTrains.slice(0, 10).map(trainSummary) }; },
  railway12306__open_order: async (input) => { assertAllowedKeys(input, ['order_id']); const id = order(getQuery(input, 'order_id')).id; const route = `/order-detail?id=${encodeURIComponent(id)}`; await openAppRoute('railway12306', route); return { route, order_id: id }; },
  railway12306__open_passengers: async () => { await openAppRoute('railway12306', '/passengers'); return { route: '/passengers' }; },
  railway12306__open_train_for_booking: async (input) => { assertAllowedKeys(input, ['train_no']); const no = getQuery(input, 'train_no'); const index = latestDirectTrains.findIndex((t) => t.trainNo.toLowerCase() === no.toLowerCase()); if (index < 0) requireFound(undefined, 'TRAIN_NOT_FOUND', `Train not found in latest query: ${no}`); useRailwayStore.setState({ directTrains: latestDirectTrains }); await openAppRoute('railway12306', '/query-result'); return { route: '/query-result', train_no: no, result_index: index, submitted: false }; },
  railway12306__open_invoice: async () => { await openAppRoute('railway12306', '/invoice'); return { route: '/invoice' }; },
};

export function executeRailway12306Tool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Railway12306 tool: ${name}`)(input); }
export { RAILWAY12306_TOOL_DEFINITIONS } from './definitions';
