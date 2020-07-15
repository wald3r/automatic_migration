import React from 'react'
import { Button } from 'react-bootstrap'
import billingService from '../services/billingService'

const Billing = () => {

  const handleBilling = async () => {
    await billingService.getBilling()
  }

  return(
    <div>
      <Button onClick={() => handleBilling()}>test</Button>
    </div>
  )
}


export default Billing