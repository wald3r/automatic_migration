
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'
import instancesListReducer from './reducers/instancesListReducer'
import zonesListReducer from './reducers/zonesListReducer'
import instancesReducer from './reducers/instancesReducer'
import imagesReducer from './reducers/imagesReducer'
import userReducer from './reducers/userReducer'


const reducer = combineReducers({
  instances: instancesReducer,
  zonesList: zonesListReducer,
  instancesList: instancesListReducer,
  images: imagesReducer,
  user: userReducer
})


const store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)))

export default store