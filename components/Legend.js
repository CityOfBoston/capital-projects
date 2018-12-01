import React from 'react';
import { Card, Row } from 'reactstrap';

export default function Legend() {
  return (
    <div>
      <Card className="mt-1 border-0">
        <Row>
          <img
            src="/capital-projects/static/blueCircle.svg"
            width="25px"
            height="25px"
            className="ml-3 mr-1"
          />
          <p className="font-italic">Capital Budget Projects</p>
        </Row>

        <Row>
          <img
            src="/capital-projects/static/greyCircle.svg"
            width="25px"
            height="25px"
            className="ml-3 mr-1"
          />
          <p className="font-italic">Pedestrian Ramps</p>
        </Row>

        <Row>
          <img
            src="/capital-projects/static/line.svg"
            width="25px"
            height="25px"
            className="ml-3 mr-1"
          />
          <p className="font-italic">Street Projects</p>
        </Row>
      </Card>
    </div>
  );
}
