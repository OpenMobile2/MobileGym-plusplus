import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExperiencePage from '../pages/ExperiencePage';

export function GeneratedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExperiencePage nodeId="home.main" />} />
      <Route path="/search" element={<ExperiencePage nodeId="home.search.landing" />} />
      <Route path="/search/suggest" element={<ExperiencePage nodeId="home.search.sug" />} />
      <Route path="/search/results" element={<ExperiencePage nodeId="home.search.results" />} />
      <Route path="/trip" element={<ExperiencePage nodeId="trip.main" />} />
      <Route path="/flight" element={<ExperiencePage nodeId="flight.search" />} />
      <Route path="/flight/city" element={<ExperiencePage nodeId="flight.citypicker" />} />
      <Route path="/flight/calendar" element={<ExperiencePage nodeId="flight.calendar" />} />
      <Route path="/flight/list" element={<ExperiencePage nodeId="flight.list" />} />
      <Route path="/flight/cabins" element={<ExperiencePage nodeId="flight.cabins" />} />
      <Route path="/flight/booking" element={<ExperiencePage nodeId="flight.booking" />} />
      <Route path="/order/flight" element={<ExperiencePage nodeId="flight.order.detail" />} />
      <Route path="/hotel" element={<ExperiencePage nodeId="hotel.search" />} />
      <Route path="/hotel/city" element={<ExperiencePage nodeId="hotel.citypicker" />} />
      <Route path="/hotel/calendar" element={<ExperiencePage nodeId="hotel.calendar" />} />
      <Route path="/hotel/list" element={<ExperiencePage nodeId="hotel.list" />} />
      <Route path="/hotel/detail" element={<ExperiencePage nodeId="hotel.detail" />} />
      <Route path="/hotel/booking" element={<ExperiencePage nodeId="hotel.booking" />} />
      <Route path="/train" element={<ExperiencePage nodeId="train.search" />} />
      <Route path="/train/station" element={<ExperiencePage nodeId="train.stationpicker" />} />
      <Route path="/train/list" element={<ExperiencePage nodeId="train.list" />} />
      <Route path="/train/detail" element={<ExperiencePage nodeId="train.detail" />} />
      <Route path="/train/booking" element={<ExperiencePage nodeId="train.booking" />} />
      <Route path="/train/passengers" element={<ExperiencePage nodeId="train.passenger.pick" />} />
      <Route path="/ticket" element={<ExperiencePage nodeId="ticket.channel" />} />
      <Route path="/ticket/detail" element={<ExperiencePage nodeId="ticket.detail" />} />
      <Route path="/ticket/booking" element={<ExperiencePage nodeId="ticket.booking" />} />
      <Route path="/pay" element={<ExperiencePage nodeId="pay.cashier" />} />
      <Route path="/pay/success" element={<ExperiencePage nodeId="pay.success" />} />
      <Route path="/orders" element={<ExperiencePage nodeId="orders.center" />} />
      <Route path="/order/hotel" element={<ExperiencePage nodeId="orders.detail.hotel" />} />
      <Route path="/order/ticket" element={<ExperiencePage nodeId="orders.detail.ticket" />} />
      <Route path="/me" element={<ExperiencePage nodeId="mine.main" />} />
      <Route path="/me/passengers" element={<ExperiencePage nodeId="mine.passengers" />} />
      <Route path="/me/passenger/edit" element={<ExperiencePage nodeId="mine.passenger.edit" />} />
      <Route path="/me/coupons" element={<ExperiencePage nodeId="mine.coupons" />} />
      <Route path="/me/favorites" element={<ExperiencePage nodeId="mine.favorites" />} />
      <Route path="/me/settings" element={<ExperiencePage nodeId="mine.settings" />} />
      <Route path="/login" element={<ExperiencePage nodeId="auth.login" />} />
      <Route path="/homestay" element={<ExperiencePage nodeId="homestay.channel" />} />
      <Route path="/homestay/list" element={<ExperiencePage nodeId="homestay.list" />} />
      <Route path="/homestay/detail" element={<ExperiencePage nodeId="homestay.detail" />} />
      <Route path="/oversea" element={<ExperiencePage nodeId="oversea.channel" />} />
      <Route path="/oversea/list" element={<ExperiencePage nodeId="oversea.list" />} />
      <Route path="/oversea/detail" element={<ExperiencePage nodeId="oversea.detail" />} />
      <Route path="/oversea/booking" element={<ExperiencePage nodeId="oversea.booking" />} />
      <Route path="/car" element={<ExperiencePage nodeId="carrental.channel" />} />
      <Route path="/car/list" element={<ExperiencePage nodeId="carrental.carlist" />} />
      <Route path="/car/guide" element={<ExperiencePage nodeId="carrental.guide" />} />
      <Route path="/transfer" element={<ExperiencePage nodeId="transfer.channel" />} />
      <Route path="/transfer/flight" element={<ExperiencePage nodeId="transfer.flightlink" />} />
      <Route path="/transfer/cars" element={<ExperiencePage nodeId="transfer.carlist" />} />
      <Route path="/vacation" element={<ExperiencePage nodeId="vacation.channel" />} />
      <Route path="/tour/list" element={<ExperiencePage nodeId="tour.list" />} />
      <Route path="/tour/detail" element={<ExperiencePage nodeId="tour.detail" />} />
      <Route path="/support/merchant" element={<ExperiencePage nodeId="support.chat.merchant" />} />
      <Route path="/support/ai" element={<ExperiencePage nodeId="support.chat.ai" />} />
      <Route path="/world/article" element={<ExperiencePage nodeId="world.article" />} />
      <Route path="/world/topic" element={<ExperiencePage nodeId="world.topic" />} />
      <Route path="/world/note" element={<ExperiencePage nodeId="world.note" />} />
      <Route path="/support" element={<ExperiencePage nodeId="support.main" />} />
      <Route path="/support/faq" element={<ExperiencePage nodeId="support.faq" />} />
      <Route path="/world" element={<ExperiencePage nodeId="world.main" />} />
    </Routes>
  );
}
