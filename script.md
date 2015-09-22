- Intro
  - I work at Adobe on CSS features:
    - Speaking about practical things: CSS Shapes, CSS Masking, CSS Blend Modes.
    - Building tools and prototypes to make life easier for web designers.
    - Practical things!
    - That doesn't matter for this talk.

  - "This talk is less practical; it's about something that fascinates me: **unconventional uses of technology** to transmit data and input."
    - networking between disconnected devices
    - unconventional input modes
    - sound, light, electro-magnetism


- Going Offline
  - icons: no wifi, no BT, no connection
  - "This is something all conference speakers dread on stage -- not having a reliable connection. But for the purpose of this talk (disconnected networking) to prove that all demos work as advertised, I'm going to turn off all connectivity."


- #badBIOS
  - Controversial story
  - Late 2013, security researcher Dragos Ruiu investigating malware on a machine:
    - clean reinstall, mallware reinfected machine;
    - flashed BIOS, malware infected again;
    - remove physical components:
      - power cord,
      - wifi card,
      - bluetooth,
      - everything networking-related,
      - HDD
    - finally, remove sound card, malware not present anymore.
  - Controversial, other sec researchers didn't replicate.
  - Plausible: infecting air-gapped devices
    - using sound to encode attack vector
    - proved by other security researchers


- Ultrasound Networking [DEMO],
  - Boris Smus, Google
    - http://smus.com/ultrasonic-networking/
    - https://github.com/borismus/sonicnet.js
    - sonicnet.js:
      - library to encode alphabet into spectrum of inaudible sound (ultrasound)
      - broadcast ultrasound then picked-up by another device
      - 2-way communication with ultrasound
      - option for audible spectrum; better range, but gets interference from ambient sound (speech, music)
  - Google Tone extension:
    - https://chrome.google.com/webstore/detail/google-tone/nnckehldicaciogcbchegobnafnjkcne?hl=en
    - share links between computers using sound


- Motion sensing with sound [DEMO]:
  - (Doppler Effect)
    https://en.wikipedia.org/wiki/Doppler_effect
    Definition: frequency shift of a wave (sound/light) as experienced by an external observer when the emitter of the wave is moving fast towards or away from the observer.

    Think of an ambulance siren: high pitch when approaching, low pitch when going away;

    Fundamental principle for radar:
      - ground station emits radio wave, wave hits moving airplane and bounces back; station measures freq shift to determine how fast the airplane is moving (i.e: is it coming or going?).
      - multiple ground stations enables triangulation (i.e: where is the airplane?)

  - doppler.js library
    - https://github.com/danielrapp/doppler
    - uses WebAudio API to send ultrasound and listens to incoming sound (echo) to determine freq shift between the two.
    - determine hand position relative to laptop (coming or going)
    - DEMOS using motion sensing: visualizer, scale object, scroll page, navigate slide deck

- Ambient light + Morse Code [DEMO]
  - DeviceLight API
    Detects changes in ambient room light.
    Typical use case: change styles to make reading easier on the eyes
    [DEMO] Unconventional use case: send rhythmic light pulses, decode as optical Morse Code.
    https://github.com/oslego/opticalmorse

  - (Support)
    Ambient light events in browsers currently work only on Firefox and in Chrome (behind a flag).
    The practicality of this technique is quite limited.
    You could argue that it's a better approach to use the camera instead of the light sensor. And you'd be right!
    But you need to **ask the user for permission** to access the camera.
    You don't have to ask for permission for DeviceLight API.
  - (Privacy)
    Spec authors + implementers recognized the misuse of DeviceLight risks leaking identity information.
    Therefore event frequency is deliberately inaccurate. Still, you can workaround that to establish a relatively reliable transmission. And that can have serious privacy implications.

    Privacy use case:
    Imagine walking into a store, phone in hand, browsing FB. (happens way more than you think, look around you in a mall)
    FB is monitoring the light sensor.
    - Light above the door flashes some pattern (FB knows you walked into Store X, identity leak).
    - Light above product aisle flashes other pattern (FB knows you're in aisle Y).
    - You linger in aisle, (FB knows you're looking so It pops a notification with a promo).
    - Light above check-out counter flashes other pattern (FB knows you bought smth).

    Pros for stores:
    - alternative to beacons, but with lower fidelity.
    - reuses light infrastructure (LED lighting)

    **If this sounds crazy and improbable, it shouldn't.**

  - Carrefour + Philips VLC experiment, indoor GPS:
    - prototype LED lights with different subtle light pulses
    - app for phone to get directions in store

  - Harald Haas at TED 2011 presents LiFi:
    - transmit data with hi-frequency light pulses from LED.
    - imperceptible to naked eye.
    - specialized equipment.
    - radio spectrum is crowded / light has more spectrum than radio.
    - radio prone to interference / light is isolated in rooms.
    - Haas demoed stream of video over LiFi

- Others:
  - Misfit Shine (wearable)
    http://misfit.com/
    Initial KickStarter video: put wearable on phone touchscreen to sync
    Speculation: sending data through simulated rhythmic touch?
    Revelation: it's just Bluetooth LE, but very low range. Putting on screen is a gimmick, not real.

  - Google Cardboard (VR headset)
    http://smus.com/magnetic-input-mobile-vr/
    Problem: device in a box, user can't access it to provide input.
    Solution: magnet on the side of the cardboard box + magnetometer sensor on device reading changes in eletro-magnetic field => significant variations = input
