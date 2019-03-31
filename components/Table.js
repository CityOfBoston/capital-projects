import React from 'react';
import PropTypes from 'prop-types';
import getPopupHTMl from './Popup';

export default function Table(props) {
  const html = props.feature != '' ? getPopupHTMl(props.feature) : null;
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1000,
        // Leave room for the legend
        bottom: '130px',
        background: 'white',
        visibility: props.visible ? 'visible' : 'hidden',
        width: '100%',
        minHeight: '45%',
      }}
      id="popupTable"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

Table.propTypes = {
  dataset: PropTypes.string,
  properties: PropTypes.array,
  visible: PropTypes.boolean,
  feature: PropTypes.object,
};
