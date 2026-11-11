(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { byId(id).textContent = value; };
  const params = new URLSearchParams(window.location.search);
  const slugs = params.getAll('estate');
  const residences = Array.isArray(window.RESIDENCES) ? window.RESIDENCES : [];
  // An absent, unknown or ambiguous route must never select a fallback property.
  const residence = slugs.length === 1
    ? residences.find((item) => item.slug === slugs[0])
    : undefined;

  if (!residence) {
    document.title = 'Residence not found — Halcyon & Co.';
    setText('state-title', 'Residence not found.');
    setText('state-message', slugs.length === 0
      ? 'No residence was selected. Return to the collection to explore our concept homes.'
      : 'This residence link is not recognised. Please choose a concept residence from the collection.');
    setText('breadcrumb-name', 'Residence not found');
    return;
  }

  document.title = `${residence.name} — Halcyon & Co.`;
  document.querySelector('meta[name="description"]').content =
    `${residence.name} in ${residence.location}. ${residence.description} Illustrative concept listing only.`;

  const fields = {
    'breadcrumb-name': residence.name,
    'property-title': residence.name,
    'property-location': residence.location,
    'property-price': residence.price,
    'property-character': residence.character,
    'property-description': residence.description,
    'property-area': residence.area,
    'property-suites': residence.suites,
    'property-region': residence.region,
    'property-caption': residence.imageCaption,
    'property-immersion-caption': residence.imageCaption,
    'property-index': String(residences.findIndex((item) => item.slug === residence.slug) + 1).padStart(2, '0'),
    'overview-title': residence.overviewTitle,
    'enquiry-residence': residence.name,
    'enquiry-ref': residence.name
  };
  Object.entries(fields).forEach(([id, value]) => setText(id, value));

  const image = byId('property-image');
  image.alt = residence.imageAlt;
  image.src = residence.image;

  const immersion = byId('property-immersion-image');
  immersion.alt = residence.imageAlt;
  immersion.src = residence.image;

  residence.overview.forEach((paragraph) => {
    const element = document.createElement('p');
    element.textContent = paragraph;
    byId('property-overview').append(element);
  });
  residence.amenities.forEach((amenity) => {
    const element = document.createElement('li');
    element.textContent = amenity;
    byId('property-amenities').append(element);
  });

  residences.filter((item) => item.slug !== residence.slug).forEach((item) => {
    const link = document.createElement('a');
    link.className = 'property-related__card';
    link.href = `property.html?estate=${encodeURIComponent(item.slug)}`;
    link.setAttribute('aria-label', `Explore ${item.name}, concept listing`);

    const media = document.createElement('div');
    media.className = 'property-related__image';
    const photo = document.createElement('img');
    photo.src = item.image;
    photo.alt = item.imageAlt;
    photo.loading = 'lazy';
    photo.decoding = 'async';
    photo.width = 800;
    photo.height = 600;
    media.append(photo);

    const meta = document.createElement('div');
    meta.className = 'property-related__meta';
    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = item.name;
    const location = document.createElement('p');
    location.textContent = item.location;
    copy.append(title, location);
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    meta.append(copy, arrow);

    const label = document.createElement('div');
    label.className = 'property-related__label';
    const price = document.createElement('span');
    price.textContent = item.price;
    const concept = document.createElement('span');
    concept.textContent = 'Concept listing';
    label.append(price, concept);
    link.append(media, meta, label);
    byId('property-related').append(link);
  });

  const form = byId('property-form');
  const name = byId('enquiry-name');
  const email = byId('enquiry-email');
  const result = byId('enquiry-result');

  const validateName = () => {
    name.setCustomValidity(name.value.trim().length < 2
      ? 'Please enter your name using at least two characters.'
      : '');
  };

  form.addEventListener('input', () => {
    name.setCustomValidity('');
    result.hidden = true;
    result.textContent = '';
  });
  form.addEventListener('submit', (event) => {
    // Deliberately local: no fetch, email action, storage or backend submission.
    event.preventDefault();
    validateName();
    email.value = email.value.trim();
    if (!form.reportValidity()) return;

    const preference = byId('enquiry-preference').value;
    const timing = preference ? ` Preferred time: ${preference.toLowerCase()}.` : '';
    const note = byId('enquiry-message').value.trim();
    const previewNote = note ? ` Your note: ${note}` : '';
    result.textContent = `Unsent preview ready for ${name.value.trim()}: a private introduction to ${residence.name}.${timing}${previewNote} No enquiry has been sent and no viewing has been booked. Your details have not been saved or transmitted.`;
    result.hidden = false;
  });
  // Use native validation UI after checking whitespace, without any form backend.
  form.noValidate = true;
  byId('enquiry-submit').type = 'submit';
  byId('enquiry-submit').disabled = false;

  byId('property-state').hidden = true;
  byId('property-detail').hidden = false;
  byId('nav-viewing').hidden = false;

  // Deferred content can change the anchor's position after initial navigation.
  if (window.location.hash === '#property-enquiry') {
    requestAnimationFrame(() => byId('property-enquiry').scrollIntoView());
  }
})();
