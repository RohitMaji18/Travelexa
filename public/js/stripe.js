/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51R6UQfBbyTOq1z3MRk4EHo7Yv863L7RDOfy2zcPQo28BGz85AF0uATHwWkXXvJSV37CIJxLZJagweD3ZQHsbHHaO00jS2hbs2U'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //  console.log(session); // 2) Create checkout form + chanre credit card

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
