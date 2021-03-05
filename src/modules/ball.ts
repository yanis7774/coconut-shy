import { Sound } from "./sound"
import { HighlightFlag } from "./highlighter"

const hitSound01 = new Sound(new AudioClip("sounds/hit01.mp3"), false)
const hitSound02 = new Sound(new AudioClip("sounds/hit02.mp3"), false)
const hitSound03 = new Sound(new AudioClip("sounds/hit03.mp3"), false)
const hitSounds: Sound[] = [hitSound01, hitSound02, hitSound03]

const pickUpSound = new Sound(new AudioClip("sounds/pickUp.mp3"), false)
const throwSound = new Sound(new AudioClip("sounds/throw.mp3"), false)

const THROW_STRENGTH_MULTIPLIER = 0.6

export class Ball extends Entity {
  public isActive: boolean = false
  public isThrown: boolean = true
  public body: CANNON.Body
  public world: CANNON.World
  public glowEntity = new Entity()

  constructor(transform: Transform, cannonMaterial: CANNON.Material, cannonWorld: CANNON.World) {
    super()
    engine.addEntity(this)
    this.addComponent(new GLTFShape("models/ball.glb"))
    this.addComponent(transform)
    this.world = cannonWorld
    this.toggleOnPointerDown(true)

    // Setup glow
    this.addComponent(new HighlightFlag())
    this.glowEntity.addComponent(new GLTFShape("models/ballGlow.glb"))
    this.glowEntity.addComponent(new Transform())
    this.glowEntity.getComponent(Transform).scale.setAll(0)
    this.glowEntity.setParent(this)

    // Create physics body for ball
    this.body = new CANNON.Body({
      mass: 3, // kg (Using heavier mass than expected to slow down the ball speed to prevent tunelling)
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Sphere(0.12), // Create sphere shaped body with a diameter of 0.22m
    })

    // Add material and dampening to stop the ball rotating and moving continuously
    this.body.sleep()
    this.body.material = cannonMaterial
    this.body.linearDamping = 0.4
    this.body.angularDamping = 0.4
    this.world.addBody(this.body) // Add ball body to the world

    // Ball collision
    this.body.addEventListener("collide", () => {
      let randomTrackNo = Math.floor(Math.random() * 2)
      hitSounds[randomTrackNo].playAudioOnceAtPosition(this.getComponent(Transform).position)
    })

    this.addComponent(new Animator())
    this.getComponent(Animator).addClip(new AnimationState("PickUp", { looping: false }))
  }

  playerPickup(): void {
    pickUpSound.getComponent(AudioSource).playOnce()
    this.isActive = true
    this.body.sleep()
    this.isThrown = false
    this.body.position.set(Camera.instance.position.x, Camera.instance.position.y, Camera.instance.position.z)
    this.setParent(Attachable.FIRST_PERSON_CAMERA)
    this.getComponent(Transform).position.set(0, -0.2, 0.5)
    this.playPickUpAnim()
    this.toggleOnPointerDown(false)

    // FIX: Issue with highlight glow showing when it's not supposed to
    this.glowEntity.getComponent(GLTFShape).visible = false
  }

  playerThrow(throwDirection: Vector3, throwPower: number): void {
    throwSound.getComponent(AudioSource).playOnce()

    this.isActive = false
    this.isThrown = true
    this.setParent(null)
    this.toggleOnPointerDown(true)

    // Physics
    this.body.wakeUp()
    this.body.velocity.setZero()
    this.body.angularVelocity.setZero()

    this.body.position.set(
      Camera.instance.feetPosition.x + throwDirection.x,
      throwDirection.y + Camera.instance.position.y,
      Camera.instance.feetPosition.z + throwDirection.z
    )

    let throwPowerAdjusted = throwPower * THROW_STRENGTH_MULTIPLIER

    // Throw
    this.body.applyImpulse(
      new CANNON.Vec3(throwDirection.x * throwPowerAdjusted, throwDirection.y * throwPowerAdjusted, throwDirection.z * throwPowerAdjusted),
      new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z)
    )
  }

  toggleOnPointerDown(isOn: boolean): void {
    if (isOn) {
      this.addComponentOrReplace(
        new OnPointerDown(
          () => {
            this.playerPickup()
          },
          { hoverText: "Pick up", distance: 4, button: ActionButton.PRIMARY }
        )
      )
    } else {
      if (this.hasComponent(OnPointerDown)) this.removeComponent(OnPointerDown)
    }
  }

  playPickUpAnim() {
    this.getComponent(GLTFShape).visible = true
    this.getComponent(Animator).getClip("PickUp").stop()
    this.getComponent(Animator).getClip("PickUp").play()
  }

  setGlow(isOn: boolean): void {
    isOn ? this.glowEntity.getComponent(Transform).scale.setAll(1) : this.glowEntity.getComponent(Transform).scale.setAll(0)
  }
}