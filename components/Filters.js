import React from 'react';
import { Card, Form, Input } from 'reactstrap';
import PropTypes from 'prop-types';

export default function Filters(props) {
  return (
    <div>
      <Card className="border-0 pt-4 ml-1 mr-2">
        <div id="geocoder" style={{ width: '100%' }} />
      </Card>

      <Card className="border-0 pt-2 ml-1 mr-2 pb-3">
        <h5 className="text-uppercase" style={{ letterSpacing: '1px' }}>
          Filter crashes
        </h5>
        <Form className="mt-2">
          <div className="sel">
            <h5 className="text-uppercase" style={{ fontSize: '1em' }}>
              by Cabinet:
            </h5>
            <div className="sel-c sel-c--thin">
              <Input
                type="select"
                name="selectCabinet"
                id="selectCabinet"
                onChange={props.cabinetChange}
                value={props.cabinetSelection}
                className="sel-f sel-f--thin"
              >
                <option>All</option>
                <option>Arts & Culture</option>
                <option>Economic Development Cabinet</option>
                <option>Environment, Energy & Open Space</option>
                <option>Education</option>
                <option>Health & Human Services</option>
                <option>Housing & Neighborhood Development</option>
                <option>Operations</option>
                <option>Public Safety</option>
                <option>Streets</option>
              </Input>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
}
Filters.propTypes = {
  cabinetChange: PropTypes.func,
  cabinetSelection: PropTypes.string,
};
