// const APIKEY = '1d4a1fe898c5b10f6f4ce16450f89761';
const APIURL = 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=1d4a1fe898c5b10f6f4ce16450f89761&page=';

const IMGPATH = 'https://image.tmdb.org/t/p/w1280';
const SEARCHAPI = 'https://api.themoviedb.org/3/search/movie?&api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=';

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const searchIcon = document.querySelector('.search-icon i');
const homeButton = document.getElementById('home-button');
const favoritesButton = document.getElementById('favorites-button');
const pagination = document.querySelector('.pagination');

const moviePoster = document.querySelector('.movie img');
const modal = document.getElementById('myModal');
const closeBtn = document.querySelector('.close');
const movieTitle = document.getElementById('movie-title');
const movieInfo = document.getElementById('movie-info');
const movieActors = document.getElementById('movie-actors');

const mainMenu = document.querySelector('.mainMenu');
const openMenu = document.querySelector('.openMenu');
const closeMenu = document.querySelector('.closeMenu');

const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');

let currentPage = 1;
let searchingForGenres = false;
let selectedGenres = [];

async function getMovies(url, page) {
    return fetch(`${url}${page}`)
        .then(response => response.json())
        .then(data => {
            console.log('Search Results:', data.results);
            return data.results;
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            return [];
        });
}

async function searchMovies(query, page) {
    const url = `${SEARCHAPI}${encodeURIComponent(query)}&page=${page}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Search Results:', data.results);
            return data.results;
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
            return [];
        });
}

function showHomePage() {
    fetchMovies(APIURL, currentPage);
    pagination.style.display = 'flex';
    searchingForGenres = false;

    async function fetchMovies(url, page) {
        console.log(`Fetching movies for page ${page}...`);
        const movies = await getMovies(url, page);
        showMovies(movies);
    }
    
    function showMovies(movies) {
        // clear main
        main.innerHTML = '';
    
        movies.forEach(async (movie) => {
            const { poster_path, title, vote_average, overview } = movie;
            const voteAverage = parseFloat(vote_average).toFixed(1);
    
            const movieEl = document.createElement('div');
            movieEl.classList.add('movie');
    
            movieEl.innerHTML = `
                <img src="${IMGPATH + poster_path}" alt="${title}">
                <div class="overview">
                <p class="expand"><i class="fa-solid fa-maximize"></i> Expand</p>
                <h3>${title}</h3>
                </div>
            `;

            const addToFavoritesButton = document.createElement('button');
            const addToFavoritesIcon = document.createElement('i');
            addToFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-regular');
            addToFavoritesButton.style.display = 'none';
            
            addToFavoritesButton.dataset.movieId = movie.id;
            
            addToFavoritesButton.appendChild(addToFavoritesIcon);
            
            addToFavoritesButton.addEventListener('click', (e) => {
                e.stopPropagation();
                saveToFavorites(movie);
                updateFavoriteIcon(movie.id);
                addToFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-solid');
            });
            
            movieEl.appendChild(addToFavoritesButton);
            main.appendChild(movieEl);

            movieEl.addEventListener('mouseenter', () => {
                addToFavoritesButton.style.display = 'flex';
            });
        
            movieEl.addEventListener('mouseleave', () => {
                addToFavoritesButton.style.display = 'none';
            });

            movieEl.addEventListener('click', () => {
                const movieId = movie.id;
                openMovieModal(movieId, voteAverage, overview);
            });
        });
    }
    
    async function performSearch() {
        const searchTerm = search.value;
    
        if (searchTerm) {
            try {
                currentPage = 1;
                pagination.style.display = 'none';
                const movies = await searchMovies(searchTerm, currentPage);
                showMovies(movies);
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
    
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

async function openMovieModal(movieId, voteAverage, overview) {
    const castInfoPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
        .then(response => response.json())
        .then(data => {
            const cast = data.cast.slice(0, 14);

            const actorsInfo = cast.map(async actor => {
                return fetch(`https://api.themoviedb.org/3/person/${actor.id}?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
                .then(response => response.json())
                    .then(actorData => {
                        return {
                        name: actor.name,
                        profilePath: actorData.profile_path
                    };
                });
            });

            const directorId = data.crew.find(crewMember => crewMember.job === 'Director').id;

            const directorInfo = fetch(`https://api.themoviedb.org/3/person/${directorId}?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
                .then(response => response.json())
                .then(directorData => {
                    return {
                        name: directorData.name,
                        profilePath: directorData.profile_path
                    };
                });
            return Promise.all([Promise.all(actorsInfo), directorInfo]);
        });

    const movieInfoPromise = fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=1d4a1fe898c5b10f6f4ce16450f89761&query=`)
        .then(response => response.json())
        .then(movieData => {
            const releaseDate = movieData.release_date;
            const genres = movieData.genres.map(genre => genre.name).join(', ');
            const duration = movieData.runtime;
            const status = movieData.status;

            return { releaseDate, genres, duration, status };
        });

    Promise.all([castInfoPromise, movieInfoPromise])
        .then(([castInfo, movieInfo]) => {
            const [actors, director] = castInfo;

            const actorsList = actors.filter(actor => actor.profilePath && actor.name).map(actor => {
                const actorImage = actor.profilePath
                    ? `<img src="https://image.tmdb.org/t/p/w185${actor.profilePath}" alt="${actor.name}">`
                    : '';
            
                return `<div>
                    ${actorImage}
                    <p class="actor-name">${actor.name}</p>
                </div>`;
            }).join('');

            const directorPhoto = director.profilePath ? `<img src="https://image.tmdb.org/t/p/w185${director.profilePath}" alt="${director.name}">` : '';

            const genresString = movieInfo.genres;
            const genresList = genresString.split(',');
            
            const genresContent = genresList.map(genre => `<span class="genre">${genre.trim()}</span>`).join(' ');
    
            const modalContent = `
                <div class="genres">
                    ${genresContent}
                </div>

                <div class="director">
                <div class="director-container">${directorPhoto}</div>
                    <div class="director-info">
                        <h2><strong>Director: </strong>${director.name}</h2>
                        <h2><strong>Release Date: </strong>${movieInfo.releaseDate}</h2>
                        <h2><strong>Duration: </strong>${movieInfo.duration} minutes</h2>
                        <h2><strong>Movie Rating: </strong>${voteAverage}</h2>
                    </div>
                </div>

                <div class="overview-info">
                    <h3 class="movieOverview">${overview}</h3>
                </div>

                <div class="casts">
                    <h2>Casts</h2>
                    <div class="actor">${actorsList}</div>
                </div>
            `;

            movieActors.innerHTML = modalContent;
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao buscar dados do filme: ', error);
        });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveToFavorites(movie) {
    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];
    const movieExists = favorites.some((favMovie) => favMovie.id === movie.id);
    const tooltip = document.createElement('span');

    tooltip.classList.add('tooltip');
    // tooltip.textContent = movieExists ? 'Movie is already in favorites' : 'Movie added to favorites';

    const clickedIcon = event.currentTarget;

    clickedIcon.parentElement.appendChild(tooltip);
    tooltip.classList.add('active');

    setTimeout(() => {
        tooltip.classList.remove('active');
        tooltip.remove();
    }, 2000);

    if (!movieExists) favorites.push(movie);
    localStorage.setItem('favoritesMovie', JSON.stringify(favorites));
    clickedIcon.classList.toggle('saved', !movieExists);
}

function removeFavorite(movie) {
    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];
    const updatedFavorites = favorites.filter((favMovie) => favMovie.id !== movie.id);

    localStorage.setItem('favoritesMovie', JSON.stringify(updatedFavorites));
    showFavorites();
}

function updateFavoriteIcon(movieId) {
    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];
    const isBookmarked = favorites.some((favMovie) => favMovie.id === movieId);

    const favoriteIcons = document.querySelectorAll('.fa-bookmark');
    favoriteIcons.forEach(icon => {
        const iconMovieId = icon.parentElement.dataset.movieId;
        if (iconMovieId == movieId) {
            icon.classList.toggle('saved', isBookmarked);
        }
    });
}

function showFavorites() {
    main.innerHTML = '';

    const favorites = JSON.parse(localStorage.getItem('favoritesMovie')) || [];

    if (pagination) pagination.style.display = 'none';

    favorites.forEach((movie) => {
        const { poster_path, title, vote_average, overview } = movie;
        const voteAverage = parseFloat(vote_average).toFixed(1);

        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');

        movieEl.innerHTML = `
        <img src="${IMGPATH + poster_path}" alt="${title}">
        <div class="overview">
        <p class="expand"><i class="fa-solid fa-maximize"></i> Expand</p>
        <h3>${title}</h3>
        </div>
        `;

        const removeFromFavoritesButton = document.createElement('button');
        removeFromFavoritesButton.classList.add('remove-button');
        const removeFavoritesIcon = document.createElement('i');

        removeFromFavoritesButton.classList.add('fa', 'fa-bookmark', 'fa-solid');
        removeFromFavoritesButton.classList.toggle('removeFavorite');
        
        removeFromFavoritesButton.appendChild(removeFavoritesIcon);
        
        removeFromFavoritesButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(movie);
            removeFavoritesIcon.classList.toggle('removeFavorite');
        });

        movieEl.appendChild(removeFromFavoritesButton);
        main.appendChild(movieEl);

        movieEl.addEventListener('click', () => {
            openMovieModal(movie.id, voteAverage, overview);
        });
    });
}

function hideMovies() {
    const mainSection = document.getElementById('main');
    mainSection.style.display = 'none';
}

function closeModal() {
    const genresModalContainer = document.getElementById('genres-modal-container');
    genresModalContainer.style.display = 'none';
}

async function showGenres() {
    main.innerHTML = '';
    pagination.style.display = 'flex';
    // hideMovies();

    const genresUrl = 'https://api.themoviedb.org/3/genre/movie/list?api_key=1d4a1fe898c5b10f6f4ce16450f89761';
    const response = await fetch(genresUrl);
    const data = await response.json();
    const genres = data.genres;

    const genreModalContent = document.createElement('div');
    genreModalContent.classList.add('genreModalContent');

    const genreModal = document.createElement('div');
    genreModal.classList.add('genreModal');
    genreModal.innerHTML = '<h2>Genres:</h2>';

    if (Array.isArray(genres)) {
        genres.forEach(genre => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `genre-${genre.id}`;
            checkbox.value = genre.id;
            checkbox.classList.add('genreCheckbox');

            const label = document.createElement('label');
            label.htmlFor = `genre-${genre.id}`;
            label.textContent = genre.name;
            label.classList.add('genreLabel');

            genreModal.appendChild(checkbox);
            genreModal.appendChild(label);
        });
    }

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('confirmButton');

    confirmButton.addEventListener('click', async () => {
        selectedGenres = Array.from(genreModal.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        console.log('Selected Genres:', selectedGenres);
    
        if (selectedGenres.length > 0) {
            showMoviesByGenres(selectedGenres, currentPage);
        } else {
            console.log('No genres selected.');
        }
    });

    const closeButton = document.createElement('span');
    closeButton.classList.add('closeModal');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => {
        closeModal();
        showHomePage();
    });

    genreModal.appendChild(confirmButton);
    genreModal.appendChild(closeButton);
    genreModalContent.appendChild(genreModal);

    const genresModalContainer = document.getElementById('genres-modal-container');
    genresModalContainer.innerHTML = '';
    genresModalContainer.appendChild(genreModalContent);

    genresModalContainer.style.display = 'flex';
    genresModalContainer.style.alignItems = 'center';
    genresModalContainer.style.justifyContent = 'center';
    genresModalContainer.style.height = '100vh';
    genresModalContainer.style.position = 'fixed';
    genresModalContainer.style.width = '100vw';
    genresModalContainer.style.top = '0';
    genresModalContainer.style.left = '0';
    genresModalContainer.style.background = 'rgba(0, 0, 0, 0.8)';
}

async function showMoviesByGenres(genreIds, currentPage) {
    const movies = await getMoviesByGenres(genreIds, currentPage);
    console.log('Movies:', movies);

    pagination.style.display = 'flex';
    main.innerHTML = '';

    movies.forEach(async (movie) => {
        const { poster_path, title, vote_average, overview } = movie;
        const voteAverage = parseFloat(vote_average).toFixed(1);

        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');

        movieEl.innerHTML = `
            <img src="${IMGPATH + poster_path}" alt="${title}">
            <div class="overview">
                <p class="expand"><i class="fa-solid fa-maximize"></i> Expand</p>
                <h3>${title}</h3>
            </div>
        `;

        const addToFavoritesButton = document.createElement('button');
        const addToFavoritesIcon = document.createElement('i');
        addToFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-regular');
        addToFavoritesButton.style.display = 'none';

        addToFavoritesButton.dataset.movieId = movie.id;

        addToFavoritesButton.appendChild(addToFavoritesIcon);

        addToFavoritesButton.addEventListener('click', (e) => {
            e.stopPropagation();
            saveToFavorites(movie);
            updateFavoriteIcon(movie.id);
            addToFavoritesIcon.classList.add('fa', 'fa-bookmark', 'fa-solid');
        });

        movieEl.appendChild(addToFavoritesButton);
        main.appendChild(movieEl);

        movieEl.addEventListener('mouseenter', () => {
            addToFavoritesButton.style.display = 'flex';
        });

        movieEl.addEventListener('mouseleave', () => {
            addToFavoritesButton.style.display = 'none';
        });

        movieEl.addEventListener('click', () => {
            const movieId = movie.id;
            openMovieModal(movieId, voteAverage, overview);
        });
    });

    closeModal();
}

async function getMoviesByGenres(genreIds, page) {
    searchingForGenres = true;
        const genreMoviesUrl = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&api_key=1d4a1fe898c5b10f6f4ce16450f89761&page=${page}`;
        console.log(`Genres movies for page ${page}... ${genreIds}`);
        const movies = await getMovies(genreMoviesUrl, page);
        return movies;
}

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1 && searchingForGenres === true) {
        currentPage--;
        showMoviesByGenres(selectedGenres, currentPage);
        console.log(searchingForGenres);
    } else if (currentPage > 1) {
        currentPage--;
        showHomePage();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

nextPageButton.addEventListener('click', () => {
    if (searchingForGenres === true) {
        currentPage++;
        showMoviesByGenres(selectedGenres, currentPage);
        console.log(selectedGenres);
        console.log(searchingForGenres);
    } else {
        currentPage++;
        showHomePage();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function show() {
    mainMenu.style.display = 'flex';
    mainMenu.style.top = '0';
}

function close() {
    mainMenu.style.display = "none";
}

const hamburgerLinks = document.querySelectorAll('.mainMenu li a');
hamburgerLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 800) {
            close();
        }
    });
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 821) {
        mainMenu.style.display = 'flex';
        mainMenu.style.top = 'initial';
    } else {
        mainMenu.style.display = 'none';
    }
});

window.addEventListener('load', () => {
    if (window.innerWidth <= 700) {
        close();
    }
});

openMenu.addEventListener('click', show);
closeMenu.addEventListener('click', close);

showHomePage();
