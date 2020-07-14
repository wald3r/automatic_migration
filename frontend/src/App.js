import React, { useEffect } from 'react'
import './stylesheets/general.css'
import ShowInstances from './components/ShowInstances'
import { connect } from 'react-redux'
import { getInstances } from './reducers/instancesReducer'
import { getImages } from './reducers/imagesReducer'
import Login from './components/Login'
import Registration from './components/Registration'
import Footer from './components/Footer'
import ShowImages from './components/ShowImages'
import { csv } from 'd3-request'
import instancesData from './data/instances.csv'
import zonesData from './data/zones.csv'
import { setInstancesList } from './reducers/instancesListReducer'
import { setZonesList } from './reducers/zonesListReducer'
import { ToastProvider } from 'react-toast-notifications'
import { setUser } from './reducers/userReducer'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'

const App = ( props ) => {

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedappUser')
    if (loggedUserJSON) {
      const newUser = JSON.parse(loggedUserJSON)
      props.setUser(newUser)
      props.getImages()
    }
    props.getInstances()
    csv(instancesData, (err, data) => {
      props.setInstancesList(data)
    })
    csv(zonesData, (err, data) => {
      props.setZonesList(data)
    })
  }, [])

  if(props.user === null){
    return(
      <div className='bg'>
        <div className='container1'>
          <ToastProvider>
            <Router>
              <br/>
              <div className='header'>Elastic Migration Tool</div>
              <br/>
              <Link className='link1' to='/'>Login</Link>
              <Link className='link1' to='/app/registration'>Registration</Link>
              <br/>
              <Route exact path='/' render={() => <Login/> } />
              <Route exact path='/app/registration' render={() => <Registration /> } />
            </Router>
          </ToastProvider>
        </div>
      </div>
    )
  }else{
    return(
      <div className='bg'>
        <ToastProvider>
          <div className='container3'>
            <Router>
              <br/>
              <div className='header'>Elastic Migration Tool</div>
              <br/>
              <Link className='link2' to='/'>Instances</Link>
              <Link className='link2' to='/app/images'>Images</Link>
              <Link className='link2' to='/app/registration'>Billing</Link>
              <Link className='link2' to='/app/profile'>Profile</Link>
              <br/>
              <br/>
              <Route exact path='/' render={() => <ShowInstances/> } />
              <Route exact path='/app/images' render={() => <ShowImages /> } />
            </Router>
            <Footer />
          </div>
          <div>
            <Footer />
          </div>
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