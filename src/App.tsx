import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import OrderBook from './components/OrderBook'
import { Book } from './models/Book'
import {
  GET_ORDER_BOOK_REST_ENDPOINT,
  MAX_NUMBER_OF_LEVELS,
  SOCKET_URL,
  SUBSCRIBE,
  UNSUBSCRIBE,
  SOURCE_SYMBOL,
  TARGET_SYMBOL,
} from './config'
import { Message } from './types'

function App() {
  const [book] = useState<Book>(new Book())
  const [bookSnapshotSequence, setBookSnapshotSequence] = useState<
    number | null
  >(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [playbackCompleted, setPlaybackCompeted] = useState(false)
  const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL)

  useEffect(() => {
    // Initialize the book with the data fetched from order book REST API after the component mounted
    if (subscribed)
      fetch(GET_ORDER_BOOK_REST_ENDPOINT)
        .then((res) => res.json())
        .then((data) => {
          book.init(
            data.asks.slice(0, MAX_NUMBER_OF_LEVELS),
            data.bids.slice(0, MAX_NUMBER_OF_LEVELS)
          )
          setBookSnapshotSequence(data.sequence)
          // playbackMessages(data.sequence)
        })
  }, [subscribed])

  useEffect(() => {
    // Listens to changes in orders using socket and updates the order book
    if (lastMessage && 'data' in lastMessage) {
      const data = JSON.parse(lastMessage.data)
      if (bookSnapshotSequence) {
        book.handleUpdate(data)
      } else {
        setMessages((prevMessages) => {
          return [...prevMessages, data]
        })
      }
    }
  }, [lastMessage, bookSnapshotSequence])

  useEffect(() => {
    if (bookSnapshotSequence && !playbackCompleted) {
      playbackMessages()
    }
  }, [bookSnapshotSequence, playbackCompleted])

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify(SUBSCRIBE))
      setSubscribed(true)
    }

    return () => {
      if (readyState === ReadyState.OPEN) {
        sendMessage(JSON.stringify(UNSUBSCRIBE))
        setSubscribed(false)
      }
    }
  }, [readyState])

  const playbackMessages = () => {
    if (!bookSnapshotSequence) return
    messages
      .filter((message) => message.sequence > bookSnapshotSequence)
      .forEach((message) => {
        book.handleUpdate(message)
      })
    setPlaybackCompeted(true)
  }

  return (
    <main className="px-5 py-10">
      <h1 className="text-3xl text-center">Order Book Demo</h1>
      <h2 className="text-lg text-center mt-2 text-gray-400">
        {SOURCE_SYMBOL}/{TARGET_SYMBOL}
      </h2>
      <section className="mt-10 flex justify-center">
        <OrderBook book={book} />
      </section>
    </main>
  )
}

export default App
