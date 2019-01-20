import { mapState } from 'vuex'
import RootState from '@vue-storefront/store/types/RootState'
import * as io from 'socket.io-client'
import {error} from "util";

export const PersonalDetails = {
  name: 'PersonalDetails',
  props: {
    isActive: {
      type: Boolean,
      required: true
    },
    focusedField: {
      type: String,
      required: false
    }
  },
  data () {
    return {
      isFilled: false,
      personalDetails: this.$store.state.checkout.personalDetails,
      createAccount: false,
      acceptConditions: false,
      password: '',
      rPassword: '',
      isValidationError: false
    }
  },
  computed: {
    ...mapState({
      currentUser: (state: RootState) => state.user.current
    })
  },
  methods: {
    onLoggedIn (receivedData) {
      this.personalDetails = {
        firstName: receivedData.firstname,
        lastName: receivedData.lastname,
        emailAddress: receivedData.email
      }
    },
    sendDataToCheckout () {
      if (this.createAccount) {
        this.personalDetails.password = this.password
        this.personalDetails.createAccount = true
      } else {
        this.personalDetails.createAccount = false
      }
      this.$bus.$emit('checkout-after-personalDetails', this.personalDetails, this.$v)
      this.isFilled = true
      this.isValidationError = false
    },
    edit () {
      if (this.isFilled) {
        this.$bus.$emit('checkout-before-edit', 'personalDetails')
        this.isFilled = false
      }
    },
    gotoAccount () {
      this.$bus.$emit('modal-show', 'modal-signup')
    },
    continueWithJolo () {
      console.log('called jolo.')

      this.getQrCode('f0w2w')
        .then((image) => {
          this.$bus.$emit('modal-show', 'modal-jolo-user', null, {image: image})

          console.log(image)
          this.personalDetails.firstName = 'Robert';
          this.personalDetails.lastName = 'Krüger';
          this.personalDetails.emailAddress = 'foo@example.com';
          this.sendDataToCheckout()
        })
        .catch((error) => {
          console.log(error)
        });
    },
    getQrCode (randomId: string) {
      const socket = io('https://demo-sso.jolocom.com', {query: { userId: randomId } })
      return new Promise<string>(resolve => {
        socket.on(randomId, (qrCode: string) => resolve(qrCode))
      })
    }
  },
  updated () {
    // Perform focusing on a field, name of which is passed through 'focusedField' prop
    if (this.focusedField && !this.isValidationError) {
      if (this.focusedField === 'password') {
        this.isValidationError = true
        this.password = ''
        this.rPassword = ''
        this.$refs['password'].setFocus('password')
      }
    }
  },
  beforeMount () {
    this.$bus.$on('user-after-loggedin', this.onLoggedIn)
  },
  destroyed () {
    this.$bus.$off('user-after-loggedin', this.onLoggedIn)
  }
}
