import React, { useEffect } from 'react'
import './stylesheets/general.css'
import ShowInstances from './components/ShowInstances'
import { connect } from 'react-redux'
import { getInstances } from './reducers/instancesReducer'


const App = ( props ) => {

  useEffect(() => {
    props.getInstances()
  }, [])


  return(
    <div className='header'>
      <h1>Elastic Migration Tool</h1>
      <br/>
      <ShowInstances />
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    instances: state.instances,
  }
}

const mapDispatchToProps = {
  getInstances,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)