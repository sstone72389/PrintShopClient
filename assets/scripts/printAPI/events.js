'use strict'
// requiring the necesary files...
const getFormFields = require('../../../lib/get-form-fields')
const api = require('./api')
const ui = require('./ui')
const store = require('../store.js')

const onGetCart = function (event) {
  event.preventDefault()
  api.getCart()
    .then(ui.getCartSuccess)
    .catch(ui.getCartFailure)
}

const isPrintAlreadyInCart = function (printArray, printId) {
  if (printArray.prints.length === 0) {
    return isInArray
  }
  let isInArray = false
  for (let i = 0; i < printArray.prints.length; i++) {
  // need to be double equal, does not work with strict equality
    if (printArray.prints[i].idNum == printId) {
      isInArray = true
      return isInArray
    }
  }
  return isInArray
}

const onCreatePrint = function (event) {
  event.preventDefault()
  const printArray = store.indexOfPrints
  const data = getFormFields(event.target)
  // stores unique id for later use
  const printId = $(event.target).attr('data-id')
  store.printId = printId
  // check with store.indexOfPrints to see if object already exsist with data-id on this button
  if (isPrintAlreadyInCart(printArray, printId)) {
    ui.alreadyInCart(event.target)
  } else {
    api.createPrint(data)
      .then(() => { ui.createPrintSuccess(event.target) })
      .catch(() => { ui.createPrintFailure(event.target) })
      .then(() => {
        api.indexPrints()
          .then(ui.indexPrintsSuccess)
          .catch(ui.indexPrintsFailure)
      })
  }
}

const onChangeStatus = function (event) {
  event.preventDefault()
  api.changeStatus()
    .then(ui.changeStatusSuccess)
    .catch(ui.changeStatusFailure)
}

const onUpdatePrint = function (event) {
  event.preventDefault()
  const data = getFormFields(event.target)
  const idNum = $(event.target).attr('data-id')
  store.printId = idNum
  api.updatePrint(data)
    .then(ui.updatePrintSuccess)
    .catch(ui.updatePrintFailure)
}

const onShowOrder = () => {
  event.preventDefault()
  api.showOrder()
    .then(ui.showOrderSuccess)
    .catch(ui.showOrderFailure)
}

const onIndexPrints = () => {
  event.preventDefault()
  api.indexPrints()
    .then(ui.indexPrintsSuccess)
      .then()
    .catch(ui.indexPrintsFailure)
}

// Stripe
const checkoutHandler = StripeCheckout.configure({
  key: 'pk_test_i1tYfJB6wVAjGr7vvXlkFZS7',
  locale: 'auto'
})

// Stripe checkout
const handleToken = function (token) {
  console.log('before adding the amount', token)
  token.amount = (store.totalCost * 100)
  console.log('after adding the amount', token)
  api.makeCharge(token)
    .then(output => {
      console.log('output is', output)
      if (output.status === 'succeeded') {
        console.log('purchase completed')
        onCreateOrder()
      }
    })
    .then(() => {
      onRemovePrints()
    })
    .then(ui.tokenSuccess)
    .catch(ui.tokenFailure)
}

// StripeCheckout functions
const onCheckout = function(ev) {
  console.log('at pon checkout!')
  console.log('cost it', store.totalCost)
  if (store.totalCost === undefined || store.totalCost === 0) {
    console.log('you must buy somethine before you can purchase it! Put some prints in the cart')
    return
  } else {
    checkoutHandler.open({
      name: 'Sample Store',
      description: 'Buying Prints',
      token: handleToken
    })
  }
}

const onCreateOrder = function () {
  // event.preventDefault()
  console.log('prints are', store.indexOfPrints)
  const prints = store.indexOfPrints
  console.log('and this?', prints.prints.length)
  for (let i = 0; i < prints.prints.length; i++) {
    console.log('are we here?')
    const data = {
      'order': {
        'printName': prints.prints[i].title,
        'printQuant': prints.prints[i].quantity
      }
    }
    api.createOrder(data)
      .then(ui.createOrderSuccess)
      .catch(ui.createOrderFailure)
  }
}

const onRemovePrints = () => {
  const prints = store.indexOfPrints
  console.log('inside onRemovePrints')
  for (let i = 0; i < prints.prints.length; i++) {
    console.log('inside removePrints for loop')
    const findId = prints.prints[i].id
    api.removeById(findId)
    .then(ui.removePrintsSuccess)
    .then(() => {
      api.indexPrints()
        .then(ui.indexPrintsSuccess)
        .catch(ui.indexPrintsFailure)
    })
    .catch(ui.removePrintsFailure)
  }
}

const addPrintHandlers = () => {
  // this is what will now post to make a new print
  $('.print-container').on('submit', onCreatePrint)
  $('.cart-button').on('click', onGetCart)
  $('.update-quantity').on('click', onUpdatePrint)
  $('.purcashed-button').on('click', onShowOrder)
  // index of all prints which belong to the user
  $('.cartHas-button').on('click', onIndexPrints)
  $('#buttonCheckout').on('click', onCheckout)
  $('#changeStatus').on('click', onCreateOrder)
}

module.exports = {
  addPrintHandlers
}
