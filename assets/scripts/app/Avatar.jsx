import React from 'react'
import PropTypes from 'prop-types'
import { API_URL } from '../app/config'
import { getCachedProfileImageUrl, receiveUserDetails } from '../users/profile_image_cache'

const requests = {}

export default class Avatar extends React.Component {
  static propTypes = {
    userId: PropTypes.string.isRequired
  }

  constructor (props) {
    super(props)

    this.image = null
    this.state = {
      image: getCachedProfileImageUrl(this.props.userId) || null
    }
  }

  componentDidMount () {
    // If a profile image had not been cached, initiate a fetch of it
    if (!this.state.image) {
      this.fetchAvatar(this.props.userId)
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.userId !== nextProps.userId) {
      const url = getCachedProfileImageUrl(nextProps.userId)
      if (url) {
        this.testImageUrl(url)
      } else {
        this.fetchAvatar(nextProps.userId)
      }
    }
  }

  // Clean up residual image references and listeners before unmounting.
  componentWillUnmount () {
    if (this.image !== null) {
      this.image.onerror = null
      this.image.onload = null
    }
    this.image = null
  }

  fetchAvatar = (userId) => {
    // Requests are cached so that multiple Avatar components that have the
    // same userId only need to make one request.
    if (!requests[userId]) {
      requests[userId] = window.fetch(API_URL + 'v1/users/' + userId)
        .then((response) => {
          if (!response.ok) throw new Error(response.status)
          return response.json()
        })
    }

    requests[userId]
      .then((details) => {
        receiveUserDetails(details)
        this.testImageUrl(details.profileImageUrl)
      })
      .catch((status) => {
        this.setState({ image: null })
      })
  }

  // Loads the image source url in a <img> element to test its validity.
  // If it's good, we set it, otherwise, we record an error. Note that the
  // event handlers call `setState` within them, which throws a warning if
  // these handlers are called after the component is unmounted. We must
  // clean up these handlers and the reference to the image element in
  // `componentWillUnmount`.
  testImageUrl = (url) => {
    this.image = document.createElement('img')
    this.image.onerror = () => {
      this.setState({ image: null })
      this.image = null
    }
    this.image.onload = () => {
      this.setState({ image: url })
      this.image = null
    }
    this.image.src = url
  }

  render () {
    const state = this.state
    const style = {}
    let className = 'avatar'

    // Displays the avatar image if we have it!
    if (state.image) {
      style.backgroundImage = `url(${state.image})`
    } else {
      className += ' avatar-blank'
    }

    return (
      <div className={className} style={style} />
    )
  }
}
