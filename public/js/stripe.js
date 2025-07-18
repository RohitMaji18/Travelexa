/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// This function defines HOW to book a tour
export const bookTour = async tourId => {
  const stripe = Stripe(
    'pk_test_51R6UQfBbyTOq1z3MRk4EHo7Yv863L7RDOfy2zcPQo28BGz85AF0uATHwWkXXvJSV37CIJxLZJagweD3ZQHsbHHaO00jS2hbs2U'
  );

  // 1) Get checkout session from API
  const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

  // 2) Create checkout form + charge credit card
  await stripe.redirectToCheckout({
    sessionId: session.data.session.id
  });
};

// --- ADD THIS PART ---
// This code finds the booking button on the page and runs the function when it's clicked.

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';

    // This correctly finds the tourId from the button's data attribute
    const { tourId } = e.target.closest('#book-tour').dataset;

    // This calls the function defined above with the correct ID
    bookTour(tourId);
  });
}
