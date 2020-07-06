import React, { useEffect } from 'react'
import './stylesheets/general.css'
import ShowInstances from './components/ShowInstances'
import { connect } from 'react-redux'
import { getInstances } from './reducers/instancesReducer'
import { getImages } from './reducers/imagesReducer'

import { csv } from 'd3-request'
import instancesData from './data/instances.csv'
import zonesData from './data/zones.csv'
import { setInstancesList } from './reducers/instancesListReducer'
import { setZonesList } from './reducers/zonesListReducer'
import { ToastProvider } from 'react-toast-notifications'

const App = ( props ) => {

  useEffect(() => {
    props.getInstances()
    props.getImages()
    csv(instancesData, (err, data) => {
      props.setInstancesList(data)
    })
    csv(zonesData, (err, data) => {
      props.setZonesList(data)
    })
  }, [])


  return(
    <div className='header'>
      <ToastProvider>
        <h1>Elastic Migration Tool</h1>
        <br/>
        <ShowInstances />
      </ToastProvider>
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
  getImages,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)