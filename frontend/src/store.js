
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'

import instancesReducer from './reducers/instancesReducer'

const reducer = combineReducers({
  instances: instancesReducer
})


const store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)))

export default store