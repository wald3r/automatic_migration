
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'
import instancesListReducer from './reducers/instancesListReducer'
import zonesListReducer from './reducers/zonesListReducer'
import modelsReducer from './reducers/modelsReducer'
import imagesReducer from './reducers/imagesReducer'
import userReducer from './reducers/userReducer'
import regionsListReducer from './reducers/regionsListReducer'


const reducer = combineReducers({
  models: modelsReducer,
  zonesList: zonesListReducer,
  instancesList: instancesListReducer,
  regionsList: regionsListReducer,
  images: imagesReducer,
  user: userReducer

})


const store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)))

export default store