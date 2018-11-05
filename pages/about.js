import React from 'react';
import Layout from '../components/Layout';
import { Col } from 'reactstrap';

export default class AboutPage extends React.Component {
  render() {
    return (
      <div>
        <Layout title="Capital Projects" aboutPage>
          <Col className="pl-5 pr-5">
            <div className="sh mt-4 mb-4">
              <h2 className="sh-title">Placeholder Text</h2>
            </div>
            <p>placeholder text</p>

            <p style={{ fontStyle: 'italic' }}>
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
