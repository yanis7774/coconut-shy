import { Sound } from "./sound"

const hitSound01 = new Sound(new AudioClip("sounds/hit01.mp3"), false)
const hitSound02 = new Sound(new AudioClip("sounds/hit02.mp3"), false)
const hitSound03 = new Sound(new AudioClip("sounds/hit03.mp3"), false)
const hitSounds: Sound[] = [hitSound01, hitSound02, hitSound03]

export class Coconut extends Entity {
  public body: CANNON.Body
  public world: CANNON.World

  constructor(transform: Transform, cannonMaterial: CANNON.Material, cannonWorld: CANNON.World) {
    super()
    engine.addEntity(this)
    this.addComponent(new GLTFShape("models/coconut.glb"))
    this.addComponent(transform)
    this.world = cannonWorld

    // Create physics body for coconut
    this.body = new CANNON.Body({
      mass: 1, // kg
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Sphere(0.15), // Create sphere shaped body with a diameter of 0.3m
    })

    // Add material and dampening to stop the coconut rotating and moving continuously
    this.body.sleep()
    this.body.material = cannonMaterial
    this.body.linearDamping = 0.4
    this.body.angularDamping = 0.4
    this.world.addBody(this.body) // Add coconut body to the world

    // Coconut collision
    this.body.addEventListener("collide", (e: any) => {
      // Only play sound when impact is high enough
      let relativeVelocity = e.contact.getImpactVelocityAlongNormal()
      if (Math.abs(relativeVelocity) > 0.75) {
        let randomTrackNo = Math.floor(Math.random() * 2)
        hitSounds[randomTrackNo].playAudioOnceAtPosition(this.getComponent(Transform).position)
      }
    })
  }
}

