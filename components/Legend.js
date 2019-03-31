import React from 'react';
import { Card, Row } from 'reactstrap';

export default function Legend() {
  return (
    <div>
      <Card className="mt-1 border-0">
        <Card className="border-0 pt-2 ml-1 mr-2">
          <h5 className="text-uppercase" style={{ letterSpacing: '1px' }}>
            Capital Projects
          </h5>
        </Card>

        <Card className="border-0 p-1">
          <Row>
            <img
              src="/capital-projects/static/blueRect.svg"
              width="25px"
              height="25x"
              className="ml-3 mr-1 center-block"
            />
            <p className="font-italic">Annual or Ongoing Programs</p>
          </Row>

          <Row>
            <img
              src="/capital-projects/static/orangeRect.svg"
              width="25px"
              height="25px"
              className="ml-3 mr-1"
            />
            <p className="font-italic">Projects being planned</p>
          </Row>

          <Row>
            <img
              src="/capital-projects/static/purpleRect.svg"
              width="25px"
              height="25px"
              className="ml-3 mr-1"
            />
            <p className="font-italic">Projects being designed</p>
          </Row>

          <Row>
            <img
              src="/capital-projects/static/greenRect.svg"
              width="25px"
              height="25px"
              className="ml-3 mr-1"
            />
            <p className="font-italic">Projects in construction</p>
          </Row>
        </Card>
      </Card>
    </div>
  );
}
