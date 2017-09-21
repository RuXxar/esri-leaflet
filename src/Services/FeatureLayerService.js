import { Service } from './Service';
import query from '../Tasks/Query';
import { geojsonToArcGIS } from '../Util';

export var FeatureLayerService = Service.extend({

  options: {
    idAttribute: 'OBJECTID'
  },

  query: function () {
    return query(this);
  },

  addFeature: function (feature, callback, context) {
    delete feature.id;

    feature = geojsonToArcGIS(feature);

    console.log('FeatureLayerService post addFeature', feature);
    return this.post('addFeatures', {
      features: [feature]
    }, function (error, response) {
      console.log('addFeature', error, response);
      var result = (response && response.addResults) ? response.addResults[0] : undefined;
      if (callback) {
        callback.call(context, error || response.addResults[0].error, result);
      }
    }, context);
  },

  updateFeature: function (feature, callback, context) {
    feature = geojsonToArcGIS(feature, this.options.idAttribute);

    console.log('FeatureLayerService post updateFeature', feature);
    return this.post('updateFeatures', {
      features: [feature]
    }, function (error, response) {
      console.log('updateFeature', error, response);
      var result = (response && response.updateResults) ? response.updateResults[0] : undefined;
      if (callback) {
        callback.call(context, error || response.updateResults[0].error, result);
      }
    }, context);
  },

  deleteFeature: function (id, callback, context) {
    console.log('FeatureLayerService post deleteFeature', id);
    return this.post('deleteFeatures', {
      objectIds: id
    }, function (error, response) {
      console.log('deleteFeature', error, response);
      var result = (response && response.deleteResults) ? response.deleteResults[0] : undefined;
      if (callback) {
        callback.call(context, error || response.deleteResults[0].error, result);
      }
    }, context);
  },

  deleteFeatures: function (ids, callback, context) {
    console.log('FeatureLayerService post deleteFeatures', ids);
    return this.post('deleteFeatures', {
      objectIds: ids
    }, function (error, response) {
      console.log('deleteFeatures', error, response);
      // pass back the entire array
      var result = (response && response.deleteResults) ? response.deleteResults : undefined;
      if (callback) {
        callback.call(context, error || response.deleteResults[0].error, result);
      }
    }, context);
  }
});

export function featureLayerService (options) {
  return new FeatureLayerService(options);
}

export default featureLayerService;
