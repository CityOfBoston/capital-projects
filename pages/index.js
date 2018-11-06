import React from 'react';
import Layout from '../components/Layout';
import { Col } from 'reactstrap';
import MapContainer from '../components/MapContainer';

export default class IndexPage extends React.Component {
  render() {
    return (
      <div>
        <Layout title="Capital Projects" indexPage>
          <div>
            <Col>
              <MapContainer />
            </Col>
          </div>
        </Layout>
      </div>
    );
  }
}
