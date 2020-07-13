import React, { useEffect } from 'react'
import './stylesheets/general.css'
import ShowInstances from './components/ShowInstances'
import { connect } from 'react-redux'
import { getInstances } from './reducers/instancesReducer'
import { getImages } from './reducers/imagesReducer'
import Login from './components/Login'
import Footer from './components/Footer'
import { csv } from 'd3-request'
import instancesData from './data/instances.csv'
import zonesData from './data/zones.csv'
import { setInstancesList } from './reducers/instancesListReducer'
import { setZonesList } from './reducers/zonesListReducer'
import { ToastProvider } from 'react-toast-notifications'
import { setUser } from './reducers/userReducer'

const App = ( props ) => {

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedappUser')
    if (loggedUserJSON) {
      const newUser = JSON.parse(loggedUserJSON)
      props.setUser(newUser)
    }
    props.getInstances()
    props.getImages()
    csv(instancesData, (err, data) => {
      props.setInstancesList(data)
    })
    csv(zonesData, (err, data) => {
      props.setZonesList(data)
    })
  }, [])

  if(props.user === null){
    return(
      <div className='header'>
        <ToastProvider>
          <h1>Elastic Migration Tool</h1>
          <br/>
          <Login />
        </ToastProvider>
      </div>
    )
  }else{
    return(
      <div className='header'>
        <ToastProvider>
          <h1>Elastic Migration Tool</h1>
          <br/>
          <ShowInstances />
          <Footer />
        </ToastProvider>
      </div>
    )
  }

}

const mapStateToProps = (state) => {
  return {
    instances: state.instances,
    user: state.user
  }
}

const mapDispatchToProps = {
  getInstances,
  setZonesList,
  setInstancesList,
  getImages,
  setUser
}

export default connect(mapStateToProps, mapDispatchToProps)(App)