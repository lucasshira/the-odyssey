// const APIKEY = '1d4a1fe898c5b10f6f4ce16450f89761';
const APIURL = 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=1d4a1fe898c5b10f6f4ce16450f89761&page=1';
const IMGPATH = 'https://image.tmdb.org/t/p/w1280';
const SEARCHAPI = 'https://api.themoviedb.org/3/search/movie?&api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=';

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const searchIcon = document.querySelector('.search-icon i');
const homeButton = document.getElementById('home-button');
const favoritesButton = document.getElementById('favorites-button');

// const moviePoster = document.querySelector('.movie img');
const modal = document.getElementById('myModal');
const closeBtn = document.querySelector('.close');
const movieTitle = document.getElementById('movie-title');
const movieInfo = document.getElementById('movie-info');
const movieActors = document.getElementById('movie-actors');

function showHomePage() {
    getMovies(APIURL);

    async function getMovies(url) {
        const resp = await fetch(url);
        const respData = await resp.json();
    
        showMovies(respData.results);
    }
    
    function showMovies(movies) {
        // clear main
        main.innerHTML = '';
    
        movies.forEach((movie) => {
            const { poster_path, title, vote_average, overview } = movie;
            const voteAverage = parseFloat(vote_average).toFixed(1);
    
            const movieEl = document.createElement('div');
            movieEl.classList.add('movie');
    
            movieEl.innerHTML = `
                <img src="${IMGPATH + poster_path}" alt="${title}">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <span class="${getClassByRate(vote_average)}">${voteAverage}</span>
                </div>
                <div class="overview">
                <h3>${title}</h3>
                    ${overview}
                </div>
            `;
            
            main.appendChild(movieEl);

            movieEl.addEventListener('click', () => {
                const movieId = movie.id;
                openMovieModal(movieId);
            });

        });
    }
    
    function getClassByRate(vote) {
        if (vote >= 8) {
            return 'green';
        } else if (vote >= 5) {
            return 'orange';
        } else {
            return 'red';
        }
    }
    
    function performSearch() {
        const searchTerm = search.value;
    
        if (searchTerm) {
            getMovies(SEARCHAPI + searchTerm);
            search.value = '';
        }
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch();
    });
    
    searchIcon.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });
}

function openMovieModal(movieId) {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
        .then(response => response.json())
        .then(data => {
            const cast = data.cast.slice(0, 8);

            const actorsInfo = cast.map(actor => {
                return fetch(`https://api.themoviedb.org/3/person/${actor.id}?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
                    .then(response => response.json())
                    .then(actorData => {
                        return {
                            name: actor.name,
                            profilePath: actorData.profile_path
                        };
                    });
            });

            Promise.all(actorsInfo)
                .then(actors => {
                    const actorsList = actors.map(actor => {
                        return `<div class="actor">
                            <img src="https://image.tmdb.org/t/p/w185${actor.profilePath}" alt="${actor.name}">
                            <p>${actor.name}</p>
                        </div>`;
                    }).join('');

                    const modalContent = `
                    <div class="casts">
                        <h2>Casts</h2>
                        <div class="actors">
                            ${actorsList}
                        </div>
                    </div>
                `;

                movieActors.innerHTML = modalContent;

                const addToFavoritesButton = document.createElement('button');
                const addToFavoritesIcon = document.createElement('i');
                addToFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-regular');
                
                addToFavoritesButton.appendChild(addToFavoritesIcon);
                
                addToFavoritesButton.addEventListener('click', () => {
                    saveToFavorites(movie);
                });

                modal.appendChild(addToFavoritesButton);

                modal.style.display = 'block';

                })
                .catch(error => {
                    console.error('Erro ao buscar dados dos atores:', error);
                });
        })
        .catch(error => {
            console.error('Erro ao buscar dados do elenco:', error);
    });
}

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

function saveToFavorites(movie) {
    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];
    const movieExists = favorites.some((favMovie) => favMovie.id === movie.id);
    const tooltip = document.createElement('span');

    tooltip.classList.add('tooltip');
    tooltip.textContent = movieExists ? 'Movie is already in favorites' : 'Movie added to favorites';

    const clickedIcon = event.currentTarget;

    clickedIcon.parentElement.appendChild(tooltip);
    tooltip.classList.add('active');

    setTimeout(() => {
        tooltip.classList.remove('active');
        tooltip.remove();
    }, 2000);

    if (!movieExists) favorites.push(movie);
    localStorage.setItem('favoritesMovie', JSON.stringify(favorites));
}

function showFavorites() {
    main.innerHTML = '';

    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];

    favorites.forEach((movie) => {
        const { poster_path, title, vote_average, overview } = movie;
        const voteAverage = parseFloat(vote_average).toFixed(1);

        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');

        movieEl.innerHTML = `
            <img src="${IMGPATH + poster_path}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <span class="${getClassByRate(vote_average)}">${voteAverage}</span>
            </div>
            <div class="overview">
                <h3>${title}</h3>
                ${overview}
            </div>
        `;

        const removeFromFavoritesButton = document.createElement('button');
        removeFromFavoritesButton.classList.add('remove-button');
        const removeFavoritesIcon = document.createElement('i');

        removeFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-regular');
        
        removeFromFavoritesButton.appendChild(removeFavoritesIcon);
        
        removeFromFavoritesButton.addEventListener('click', () => {
            removeFavorite(movie);
        });

        movieEl.appendChild(removeFromFavoritesButton);
        main.appendChild(movieEl);

        movieEl.addEventListener('click', () => {
            const movieId = movie.id;
            openMovieModal(movieId);
        });
    });

    function getClassByRate(vote) {
        if (vote >= 8) {
            return 'green';
        } else if (vote >= 5) {
            return 'orange';
        } else {
            return 'red';
        }
    }
}

function removeFavorite(movie) {
    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];
    const updatedFavorites = favorites.filter((favMovie) => favMovie.id !== movie.id);

    localStorage.setItem('favoritesMovie', JSON.stringify(updatedFavorites));
    showFavorites();
}

homeButton.addEventListener('click', showHomePage);
favoritesButton.addEventListener('click', showFavorites);

showHomePage();