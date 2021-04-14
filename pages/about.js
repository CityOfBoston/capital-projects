import React from 'react';
import Layout from '../components/Layout';
import { Col } from 'reactstrap';

export default class AboutPage extends React.Component {
  render() {
    return (
      <div>
        <Layout title="Capital Projects" aboutPage>
          <Col className="p-5">
            <h4>Capital Projects Map</h4>
            <p>
              This map shows all City parks, facilities, and streets with
              capital projects in the FY22 Recommended Capital Plan. It does not
              show City-wide investments such as technology or street trees.
            </p>

            <p>
              Please note that the data and information on this website is for
              informational purposes only. While we seek to provide accurate
              information, note that errors may be present and information
              presented may not be complete. Accordingly, the City of Boston
              makes no representation as to the accuracy of the information or
              its suitability for any purpose and disclaim any liability for
              omissions or errors that may be contained therein.
            </p>
          </Col>
        </Layout>
      </div>
    );
  }
}
