/**
 * Close the bidding of an artwork listing and choose the
 * highest bid that is over the asking price
 * @param {org.artwork.auction.CloseBidding} closeBidding - the closeBidding transaction
 * @transaction
 */
async function closeBidding(closeBidding) { // eslint-disable-line no-unused-vars
  const listing = closeBidding.listing
  if (listing.state !== 'FOR_SALE') {
    throw new Error ('Listinig is not FOR SALE');
  }
  //by default we mark the listing as RESERVE_NOT_MET
  listing.state = 'RESERVE_NOT_MET';
  let highestOffer = null;
  let seller = null;
  let buyer = null;
  if (listing.offers && listing.offers.length > 0) {
    //sort the bids by bidPrice
    listing.offers.sort(function(a, b) {
      return (b.bidPrice - a.bidPrice);
    });
    highestOffer = listing.offers[0];
    if (highestOffer.bidPrice >= listing.reservePrice) {
      //mark the listing as SOLD
      listing.state = 'SOLD';
      buyer = highestOffer.bidder;
      seller = listing.artwork.owner;
      //update the balance of the seller
      console.log('#### seller balance before : ' + seller.balance);
      seller.balance += highestOffer.bidPrice;
      console.log('#### seller balance after : ' + seller.balance);
      //update the balance of the buyer
      console.log('#### buyer balance before : ' + buyer.balance);
      buyer.balance -= highestOffer.bidPrice;
      console.log('#### buyer balance after : ' + buyer.balance);
      //transfer the listing to the buyer
      listing.artwork.owner = buyer;
      //clear the listing
      listing.offers = null;
    }
  }
  
  if (highestOffer) {
    //save the artwork
    const artworkRegistry = await getAssetRegistry('org.artwork.auction.Artwork');
    await artworkRegistry.update(listing.artwork);
  }
  
  //save the artwork listing
  const artworkListingRegistry = await getAssetRegistry('org.artwork.auction.ArtworkListing');
  await artworkListingRegistry.update(listing);
  
  if (listing.state === 'SOLD') {
    //save the buyer
    const userRegistry = await getParticipantRegistry('org.artwork.auction.Bidder');
    await userRegistry.updateAll([buyer, seller]);
  }
}

/**
 * Make an Offer for an artworkListing
 * @param {org.artwork.auction.Offer} offer - the offer
 * @transaction
 */
async function makeOffer(offer) { // eslint-disable-line no-unused-vars
  let listing = offer.listing;
  if (listing.state !== 'FOR_SALE') {
    throw new Error ('Listing is NOT FOR SALE');
  }
  if (!listing.offers) {
    listing.offers = [];
  }
  listing.offers.push(offer);
  
  //save the artwork listing
  const artworkListingRegistry = await getAssetRegistry('org.artwork.auction.ArtworkListing');
  await artworkListingRegistry.update(listing);
}