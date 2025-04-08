'use strict';

// prettier-ignore

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
 
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min
    
  }
  _setDescription(){
  //prettier-ignore
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December',];
    this.description= ` ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
 
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //min
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km

    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration); //min
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //min/km
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
const run1 = new Running([39, -4], 5.2, 24, 178);
const cycl1 = new Cycling([39, -4], 27, 95, 523);

///////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //get users position
    this._getPosition();
    //Attach event handlers
    //get data from local storage
    this._getLocalStorage();
    form.addEventListener(`submit`, this._newWorkout.bind(this));
    //mijenjanje sa cycle na runn i obratno sa toggle(on/off switch) u izborniku lievom
    inputType.addEventListener(`change`, this._toggleElevationField);
    containerWorkouts.addEventListener(`click`, this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handle clicks on the map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }
  _hideForm() {
    //CLEAR INPUT FIELDS
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ``;
    form.style.display = `none`;
    form.classList.add(`hidden`);
    setTimeout(() => ((form.style.display = `grid`), 1000));
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');

    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();
    //GET DATA FROM THE FORM
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //check if its valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
      )
        return alert(`Inputs have to be positive numbers!`);
      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }

    //if workout cycling create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`Inputs have to be positive numbers!`);
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //add new object to the workout array
    this.#workouts.push(workout);
    //render workout on the map as marker
    this._renderWorkout(workout);
    //render workout on list
    this._renderWorkoutMarker(workout);
    //hide form +clear input fields
    this._hideForm();
    //set locaal storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">   <h2 class="workout__title">${workout.description}
    </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === `running`) {
      html += `<div class="workout__details">
       
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === `cycling`) {
      html += `<div class="workout__details">
        
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">m</span>
  </div>
</li> `;
    }
    form.insertAdjacentHTML(`afterend`, html);
  }
  _moveToPopup(e) {
    let workoutEl = e.target.closest('.workout'); // Find the workout element

    if (!workoutEl) return; // Exit if no workout element is clicked

    // Find the corresponding workout object
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    if (!workout) return; // Exit if no workout is found

    // Add a button dynamically if needed (optional)

    if (!workoutEl.querySelector('.workout-btn')) {
      // Add the button dynamically
      workoutEl.insertAdjacentHTML(
        'afterBegin',
        `<button class="workout-btn">X</button>`
      );

      // Add an event listener to the newly added button
      workoutEl.querySelector('.workout-btn').addEventListener('click', () => {
        // Find the workout's ID from the element
        const workoutId = workoutEl.dataset.id;

        // Remove the workout from the workouts array
        this.#workouts = this.#workouts.filter(work => work.id !== workoutId);

        // Update the DOM
        workoutEl.remove();

        // Update local storage
        this._setLocalStorage();
      });
    }

    // Move to the workout's location on the map
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem(`workouts`);
    location.reload();
  }
}
const app = new App();
