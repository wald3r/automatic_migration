import React, { useEffect } from 'react'
import './stylesheets/general.css'
import ShowInstances from './components/ShowInstances'
import { connect } from 'react-redux'
import { getInstances } from './reducers/instancesReducer'
import { csv } from 'd3-request'
import instancesData from './data/instances.csv'
import zonesData from './data/zones.csv'
import { setInstancesList } from './reducers/instancesListReducer'
import { setZonesList } from './reducers/zonesListReducer'

const App = ( props ) => {

  useEffect(() => {
    props.getInstances()
    csv(instancesData, (err, data) => {
      props.setInstancesList(data)
    })
    csv(zonesData, (err, data) => {
      props.setZonesList(data)
    })
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
  setZonesList,
  setInstancesList,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)