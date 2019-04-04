import React from 'react';
import PropTypes from 'prop-types';
import getPopupHTML from './Popup';

export default function Table(props) {
  const html = props.feature != '' ? getPopupHTML(props.feature) : null;
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1000,
        // Leave room for the legend
        bottom: '220px',
        background: 'white',
        visibility: props.visible ? 'visible' : 'hidden',
        minHeight: '45%',
        left: 0,
        right: 0,
      }}
      className="pt-2 pr-4 pl-4"
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
