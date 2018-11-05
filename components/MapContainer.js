import React from 'react';
import { Col, Row } from 'reactstrap';
import Filters from '../components/Filters';
import Map from '../components/Map';

export default function MapContainer() {
  return (
    <Row>
      <Col lg="3">
        <Filters />
      </Col>
      <Col lg="9" className="p-lg-0 pr-md-5 pl-md-5">
        <Map />
      </Col>
    </Row>
  );
}
