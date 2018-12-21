import React from 'react';
import { Col, Row } from 'reactstrap';
import Filters from '../components/Filters';
import Map from '../components/Map';
import Legend from '../components/Legend';

class MapContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cabinetSelection: 'All',
    };
  }

  // We update cabinetSelection state when the selection changes.
  filterCabinets = e => {
    this.setState({ cabinetSelection: e.target.value });
  };

  render() {
    return (
      <Row>
        <Col lg="3">
          <Filters
            cabinetSelection={this.state.cabinetSelection}
            cabinetChange={this.filterCabinets}
          />
          {/* add legend twice - once for when screen is large 
            and it should display above the map, and once for when 
            screen is small and it should display below the map */}
          <Col className="pt-5 p-0 d-none d-lg-block">
            <Legend />
          </Col>
        </Col>
        <Col lg="9" className="p-lg-0 pr-md-5 pl-md-5">
          <Map cabinetSelection={this.state.cabinetSelection} />
          {/* second instance of the legend component for when 
          screen is small */}
          <Col className="d-sm-block d-md-block d-lg-none pl-0">
            <Legend />
          </Col>
        </Col>
      </Row>
    );
  }
}

export default MapContainer;
