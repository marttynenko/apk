window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    try {
      const info = await navigator.serviceWorker.register('sw.js')
      console.log(info)
    } catch (e) {
      console.log(e)
      console.log('service worker load fail')
    }
  }
});

(function () {
  const startScreen = document.querySelector('.screen-start')
  if (!startScreen) return

  startScreen.addEventListener('click', (e) => {
    e.preventDefault()
    document.querySelector('.screen-start-btn').classList.add('opened')
  })
})();


const toScreenMain = (event) => {
  event.preventDefault()
  document.querySelector('.screen-main').classList.add('active')
  document.querySelector('.screen-start-btn').classList.remove('opened')

  setTimeout(() => {
    document.querySelector('.screen-start').classList.remove('active')
  }, 810)
}

const toScreenStart = (event) => {
  event.preventDefault()
  document.querySelector('.screen-start-btn').classList.remove('opened')
  document.querySelector('.screen-main').classList.remove('active')
  document.querySelector('.screen-start').classList.add('active')
  document.querySelector('.screen-main-finger').classList.remove('ui-hidden')
}

document.querySelector('.screen-start-btn').addEventListener('click', toScreenMain)
document.querySelector('.screen-main-back').addEventListener('click', toScreenStart)

const parsePopup = (data) => {
  if (!data || !data.profile) return

  //фото
  const img = document.querySelector('.person-photo img')
  img.style.opacity = 0
  img.addEventListener('load', () => {
    img.style.opacity = 1
  })
  img.setAttribute('src','//apk.farbatest.com/storage/'+data.profile.photo_cropped)
  //должность
  document.querySelector('.person-pos').textContent = data.profile.position
  //фио
  document.querySelector('.person-name').textContent = data.profile.fio
  //описание
  document.querySelector('.person-descr').textContent = data.profile.description === '-' ? '' : data.profile.description
  //стаж
  document.querySelector('.person-experience-sticker').textContent = data.profile.experience
  if (!data.profile.experience ||  data.profile.experience.length < 2) {
    document.querySelector('.person-experience').classList.add('ui-hidden')
  } else {
    document.querySelector('.person-experience').classList.remove('ui-hidden')
  }

  //обрабатываем ссылки на следующий/предыдущий профиль
  const prevLink = document.querySelector('.popup-btns-prev')
  const nextLink = document.querySelector('.popup-btns-next')
  if (data.prev) {
    prevLink.dataset.to = data.prev
    prevLink.classList.remove('ui-hidden')
  } else {
    prevLink.dataset.to = data.prev
    prevLink.classList.add('ui-hidden')
  }

  if (data.next) {
    nextLink.dataset.to = data.next
    nextLink.classList.remove('ui-hidden')
  } else {
    nextLink.dataset.to = data.next
    nextLink.classList.add('ui-hidden')
  }

  document.querySelector('.popups').classList.add('opened')
  document.documentElement.classList.add('popup-opened')
}

//тянем профиль
const fetchProfile = async (url) => {
  const response = await fetch(url)
  return await response.json()
}

//закрываем попап
const closePopup = (event) => {
  event.preventDefault()
  document.querySelector('.popups').classList.remove('opened')
  document.documentElement.classList.remove('popup-opened')
}

//обработчик клика на зернах
(function () {
  const corn = document.querySelectorAll('.screen-main-corn')
  if (!corn.length) return

  corn.forEach(el => {
    el.addEventListener('click', async (e) => {
      e.preventDefault()

      const data = await fetchProfile('//apk.farbatest.com/api/profile/get')
      parsePopup(data)

      document.querySelector('.screen-main-finger').classList.add('ui-hidden')
    })
  })

  document.querySelector('.screen-main-finger')
    .addEventListener('click', async (e) => {
      e.preventDefault()
      console.log('click finger')

      const data = await fetchProfile('//apk.farbatest.com/api/profile/get')
      parsePopup(data)

      document.querySelector('.screen-main-finger').classList.add('ui-hidden')
    })
})();


//обработчик закрытия попапа
document.querySelector('.popup-btns-close').addEventListener('click', closePopup)


//обрабатываем ссылки на следующий/предыдущий профиль
document.querySelectorAll('.popup-btns-toprofile')
  .forEach(el => {
    el.addEventListener('click', async (event) => {
      event.preventDefault()

      const id = el.dataset.to
      const data = await fetchProfile(`//apk.farbatest.com/api/profile/get/${id}`)
      parsePopup(data)
    })
  })


//фетчим запросы поиска
const fetchSearch = async (req) => {
  const r = await fetch(`//apk.farbatest.com/api/profile/search/${req}`)
  const rr = await r.json()
  return {status: r.status, profiles: rr.profiles ? rr.profiles : []}
}


//открываем попа из поиска
const openPopup = async (id) => {
  const data = await fetchProfile(`//apk.farbatest.com/api/profile/get/${id}`)
  parsePopup(data)
}

document.addEventListener('click', (e) => {
  if(e.target.closest('.screen-main-person') || e.target.classList.contains('screen-main-person')) {
    const parent = e.target.closest('.screen-main-person') || e.target

    parent.querySelector('.screen-main-overlay').classList.toggle('active')
  } else {
    document.querySelectorAll('.screen-main-overlay').forEach(item => {
      item.classList.remove('active')
    })
  }
})

//парсим результаты поиска
const parseSearchResults = (arr, phrase) => {
  let output = ''
  if (!arr || !arr.length) {
    output = `<div class="search-not-found">Нет результатов по запросу “${phrase}”</div>`
    return output
  }

  arr.forEach(el => {
    output += `
    <a href="javascript:void(0)" class="search-result" data-id="${el.id}" onclick="openPopup(${el.id})">
      <div class="search-result-photo">
        <img src="//apk.farbatest.com/storage/${el.photo_search}" alt="${el.fio}">
      </div>
      <div class="search-result-name">${el.fio}</div>
      <div class="search-result-arrow"></div>
    </a>
    `
  })

  return output
}


//поиск
document.querySelector('.search-form-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault()

    const input = document.querySelector('.search-form-input')
    const error = document.querySelector('.search-form-error')
    const phrase = input.value

    if (phrase.length < 2) {
      error.classList.remove('ui-hidden')
      return
    } else {
      error.classList.add('ui-hidden')
    }

    const res = await fetchSearch(phrase)

    const parsedResults = parseSearchResults(res.profiles, phrase)
    document.querySelector('.search-results').innerHTML = parsedResults
    document.querySelector('.search-drop').classList.add('opened');
  })


document.querySelector('.search-form-input')
  .addEventListener('blur', () => {
    document.querySelector('.search-form-error').classList.add('ui-hidden')
  })

//закрываем поиск по клику вне
document.addEventListener('click',(e) => {
  if (!document.querySelector('.search').contains(e.target)){
    document.querySelector('.search-drop').classList.remove('opened');
  }
})

let page = 1
let lastPage
let flag = true

const fetchList = async (page) => {
  try {
    const response = await fetch(`//apk.farbatest.com/api/profile/get_page?page=${page}`)
    const { status } = response;
    const { profiles, last_page } = await response.json();

    lastPage = last_page

    return { status, profiles, last_page };
  } catch (error) {
    console.error(error);
    return { status: 500, profiles: [] };
  }
};

const parserProfiles = (arr) => {
  let output = ''

  if (!arr || !arr.length) {
    output = `<div class="search-not-found">Нет результатов по запросу</div>`
    return output
  }

  arr.forEach((el, index) => {
    output +=
    `
      <div class="screen-main-person cirlce-${index+1}">
        <div class="screen-main-overlay">
          <div class="screen-main-name">${el.fio}</div>

          <a href="javascript:void(0)" data-id="${el.id}" onclick="openPopup(${el.id})" class="screen-main-more">Узнать больше</a>
        </div>

        <img src="//apk.farbatest.com/storage/${el.photo_cropped}" alt="alt">
      </div>
    `
  })

  return output
}

const onLoad = async (page) => {
  const { profiles } = await fetchList(page);
  const parsedResults = parserProfiles(profiles);

  document.querySelector('.screen-main-profiles').innerHTML = parsedResults;
};

window.addEventListener('load', () => {
  onLoad(page)
});

const updateCards = async(page) => {
  const allProfiles = document.querySelectorAll('.screen-main-person')

  allProfiles.forEach(item => {
    item.remove()
  })

  await onLoad(page)

  flag = true
}

document.querySelector('.screen.screen-main').addEventListener('touchstart', handleTouchStart, false);
document.querySelector('.screen.screen-main').addEventListener('touchmove', handleTouchMove, false);

var xDown = null;
var yDown = null;

function getTouches(evt) {
  return evt.touches || // чистый API JS
  evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
  const firstTouch = getTouches(evt)[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
};

function handleTouchMove(evt) {
  if ( ! xDown || ! yDown ) {
    return;
  }

  var xUp = evt.touches[0].clientX;
  var yUp = evt.touches[0].clientY;

  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;

  const parent = document.querySelector('.screen-main-profiles')

  if ( Math.abs( xDiff ) < Math.abs( yDiff ) ) {
    if ( yDiff > 0 ) {
      // swipe вверх
      if(!flag) return

      if(page < lastPage) {
        flag = false
        page = page + 1

        parent.classList.add('active')

        setTimeout(() => {
          updateCards(page)
        }, 600)

        setTimeout(() => {
          parent.classList.remove('active')
        }, 1000)
      }

    } else {
      /* swipe вниз */

      if(!flag) return

      if(page > 1) {
        flag = false
        page = page - 1

        parent.classList.add('active')

        setTimeout(() => {
          updateCards(page)
          console.log(1)
        }, 600)

        setTimeout(() => {
          parent.classList.remove('active')
          console.log(2)
        }, 1000)
      }
    }
  }

  /* свайп был, обнуляем координаты */
  xDown = null;
  yDown = null;
};