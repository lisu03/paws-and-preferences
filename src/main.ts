import './styles.scss'

interface CatCard {
  id: string
  url: string
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App container not found')
}

app.innerHTML = `
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Paws &amp; Preferences</h1>
      <p class="app__subtitle">Swipe through cats to find your favourite kitties.</p>
    </header>

    <main class="app__main">
      <section class="deck" data-view="deck">
        <div class="deck__status" id="status-text" aria-live="polite"></div>
        <div class="deck__cards" id="card-stack"></div>
        <div class="deck__controls">
          <button id="dislike-btn" class="control control--dislike" type="button" aria-label="Dislike this cat">
            Nope
          </button>
          <button id="like-btn" class="control control--like" type="button" aria-label="Like this cat">
            Love
          </button>
        </div>
        <p class="deck__hint">Swipe left or right, or use the buttons.</p>
      </section>

      <section class="summary hidden" data-view="summary">
        <h2 class="summary__title">Your favourite kitties</h2>
        <p class="summary__text">
          You liked <span id="likes-count">0</span> out of <span id="total-count">0</span> cats.
        </p>
        <div class="summary__grid" id="liked-grid"></div>
        <button id="restart-btn" class="summary__restart" type="button">
          Start over
        </button>
      </section>
    </main>
  </div>
`

const cardStack = document.querySelector<HTMLDivElement>('#card-stack')!
const statusText = document.querySelector<HTMLDivElement>('#status-text')!
const likeButton = document.querySelector<HTMLButtonElement>('#like-btn')!
const dislikeButton = document.querySelector<HTMLButtonElement>('#dislike-btn')!
const restartButton = document.querySelector<HTMLButtonElement>('#restart-btn')!
const deckView = document.querySelector<HTMLElement>('[data-view="deck"]')!
const summaryView = document.querySelector<HTMLElement>('[data-view="summary"]')!
const likesCount = document.querySelector<HTMLSpanElement>('#likes-count')!
const totalCount = document.querySelector<HTMLSpanElement>('#total-count')!
const likedGrid = document.querySelector<HTMLDivElement>('#liked-grid')!

let cats: CatCard[] = []
let likedCats: CatCard[] = []
let currentIndex = 0
let isAnimating = false

async function loadCats(limit = 15): Promise<CatCard[]> {
  statusText.textContent = 'Loading cute cats...'

  try {
    const response = await fetch(`https://cataas.com/api/cats?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to fetch cats')
    }

    const data = (await response.json()) as Array<{ _id: string }>

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No cats found')
    }

    statusText.textContent = ''

    return data.map((item) => ({
      id: item._id,
      url: `https://cataas.com/cat/${item._id}?width=600&height=800&fit=cover`,
    }))
  } catch (error) {
    console.error(error)
    statusText.textContent =
      'We could not load cats from Cataas right now. Please check your connection and try again.'
    return []
  }
}

function createCard(cat: CatCard, index: number, total: number): HTMLDivElement {
  const card = document.createElement('div')
  card.className = 'cat-card'
  card.dataset.index = index.toString()
  card.style.zIndex = String(total - index)

  card.innerHTML = `
    <img class="cat-card__image" src="${cat.url}" alt="Cute cat ${index + 1}" loading="lazy" />
    <div class="cat-card__overlay">
      <span class="badge badge--like">Like</span>
      <span class="badge badge--dislike">Nope</span>
    </div>
  `

  return card
}

function renderDeck() {
  cardStack.innerHTML = ''

  cats.forEach((cat, index) => {
    const card = createCard(cat, index, cats.length)
    cardStack.appendChild(card)
  })

  // Only the top card is interactive
  const topCard = getTopCard()
  if (topCard) {
    attachSwipeHandlers(topCard)
  }
}

function getTopCard(): HTMLDivElement | null {
  return cardStack.querySelector<HTMLDivElement>('.cat-card:last-child')
}

type Decision = 'like' | 'dislike'

function handleDecision(decision: Decision) {
  if (isAnimating) return

  const card = getTopCard()
  if (!card) return

  const cat = cats[currentIndex]
  if (!cat) return

  if (decision === 'like') {
    likedCats.push(cat)
  }

  isAnimating = true
  card.classList.add(decision === 'like' ? 'cat-card--like' : 'cat-card--dislike')

  card.addEventListener(
    'transitionend',
    () => {
      card.remove()
      currentIndex += 1
      isAnimating = false

      if (currentIndex >= cats.length) {
        showSummary()
      } else {
        const nextTopCard = getTopCard()
        if (nextTopCard) {
          attachSwipeHandlers(nextTopCard)
        }
      }
    },
    { once: true },
  )
}

function attachSwipeHandlers(card: HTMLDivElement) {
  let startX = 0
  let currentX = 0
  let dragging = false

  const handlePointerDown = (event: PointerEvent) => {
    if (isAnimating || event.button !== 0) return
    dragging = true
    startX = event.clientX
    currentX = startX
    card.setPointerCapture(event.pointerId)
    card.style.transition = 'none'
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragging) return
    currentX = event.clientX
    const deltaX = currentX - startX
    const rotation = deltaX / 15
    const opacity = Math.min(Math.abs(deltaX) / 120, 1)

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`
    card.style.setProperty('--swipe-opacity', opacity.toString())
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    card.releasePointerCapture(event.pointerId)

    const deltaX = currentX - startX
    const threshold = 90
    card.style.transition = ''

    if (Math.abs(deltaX) > threshold) {
      const decision: Decision = deltaX > 0 ? 'like' : 'dislike'
      // Quick fling animation in chosen direction
      const endX = deltaX > 0 ? window.innerWidth * 1.5 : -window.innerWidth * 1.5
      const rotation = deltaX > 0 ? 25 : -25
      card.style.transform = `translateX(${endX}px) rotate(${rotation}deg)`
      card.style.setProperty('--swipe-opacity', '1')

      // Let CSS transition finish then apply final decision handling
      setTimeout(() => handleDecision(decision), 120)
    } else {
      // Snap back
      card.style.transform = ''
      card.style.setProperty('--swipe-opacity', '0')
    }
  }

  card.addEventListener('pointerdown', handlePointerDown)
  card.addEventListener('pointermove', handlePointerMove)
  card.addEventListener('pointerup', handlePointerUp)
  card.addEventListener('pointercancel', handlePointerUp)
}

function showSummary() {
  deckView.classList.add('hidden')
  summaryView.classList.remove('hidden')

  likesCount.textContent = likedCats.length.toString()
  totalCount.textContent = cats.length.toString()

  likedGrid.innerHTML = ''

  if (likedCats.length === 0) {
    likedGrid.innerHTML = '<p class="summary__empty">You did not like any cats this time. Try again!</p>'
    return
  }

  likedCats.forEach((cat, index) => {
    const figure = document.createElement('figure')
    figure.className = 'summary__item'
    figure.innerHTML = `
      <img src="${cat.url}" alt="Liked cat ${index + 1}" loading="lazy" />
    `
    likedGrid.appendChild(figure)
  })
}

function resetApp() {
  currentIndex = 0
  likedCats = []
  cats = []
  cardStack.innerHTML = ''
  likedGrid.innerHTML = ''
  statusText.textContent = ''
  deckView.classList.remove('hidden')
  summaryView.classList.add('hidden')
  void bootstrap()
}

likeButton.addEventListener('click', () => handleDecision('like'))
dislikeButton.addEventListener('click', () => handleDecision('dislike'))
restartButton.addEventListener('click', resetApp)

async function bootstrap() {
  const fetchedCats = await loadCats(15)
  if (fetchedCats.length === 0) return
  cats = fetchedCats
  renderDeck()
}

bootstrap()
