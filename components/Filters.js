import React from 'react';
import { Card, Row, Form, Input } from 'reactstrap';
import PropTypes from 'prop-types';

export default function Filters(props) {
  return (
    <div>
      <Row className="ml-1">
        <h5 className="mt-3 font-weight-bold text-uppercase">
          Filter Projects:
        </h5>
      </Row>
      <Card className="border-0">
        <Form>
          <div className="sel">
            <div className="sel-c sel-c--fw">
              <Input
                type="select"
                name="selectCabinet"
                id="selectCabinet"
                onChange={props.cabinetChange}
                value={props.cabinetSelection}
                className="sef-f"
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
