- Intro
  - Work at Adobe on CSS features.
  - Talk about practical things: CSS Shapes, CSS Masking, CSS Blend Modes.
  - Build tools and prototypes to make life easier for web designers.
  - That doesn't matter for this talk.
  - This talk is less practical, but it's about something that fascinates me: **unconventional uses of web technology**.
  - networking between disconnected devices
  - unconventional input modes
  - sound, light, magnetism, touch


- Going Offline
  - icons: no wifi, no BT, no connection
  - "This is something all conference speakers dread on stage -- not having a reliable connection. But for the purpose of this talk (disconnected networking) and to be truly honest that all demos work as advertised, I'm going to turn off all connectivity."


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


- Ultrasond Networking,
  - Boris Smus, Google


- Ambient light + Morse Code
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
