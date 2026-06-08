/* ═══════════════════════════════
   BOOKING.JS
═══════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const locationInputs = document.querySelectorAll('input[name="location_type"]');
  const locationNoteWrap = document.getElementById('locationNoteWrap');

  function checkLocation() {
    const val = document.querySelector('input[name="location_type"]:checked')?.value;
    if (val === 'outdoor' || val === 'both') {
      locationNoteWrap?.classList.add('show');
    } else {
      locationNoteWrap?.classList.remove('show');
    }
  }

  locationInputs.forEach(input => {
    input.addEventListener('change', checkLocation);
  });

  checkLocation();
});
