/* eslint-disable */

import axios from 'axios';

const stripe = Stripe(
	'pk_test_51HeeNGGJht1G0sTiA3qhh7G47DA4YshS2bnRWzFpeRoAo87wSo5bPMRtG28BDMzrEP5gCEViUkmOqQPsytrCwz3b00deAO2qwt'
);

export const bookTour = async (tourId) => {
	try {
		// get session from the API
		const session = await axios(
			`/api/v1/bookings/checkout-session/${tourId}`
		);
		console.log(session);

		// create checkout form + charge credit card
		await stripe.redirectToCheckout({
			sessionId: session.data.session.id,
		});
	} catch (err) {
		showAlert('error', err);
	}
};
