import { Ball } from "./modules/ball"
import { Coconut } from "./modules/coconut"
// import { coconutShyMeshVertices, coconutShyMeshIndices } from "./modules/meshData/coconutShyMesh"
// import { wallMeshVertices, wallMeshIndices } from "./modules/meshData/wallMesh"
import * as ui from "@dcl/ui-scene-utils"
import { loadColliders } from "./modules/colliderSetup"

const base = new Entity()
base.addComponent(new GLTFShape("models/baseLight.glb"))
engine.addEntity(base)

const coconutShy = new Entity()
coconutShy.addComponent(new GLTFShape("models/coconutShy.glb"))
coconutShy.addComponent(new Transform())
engine.addEntity(coconutShy)

// Setup our world
const world = new CANNON.World()
world.quatNormalizeSkip = 0
world.quatNormalizeFast = false
world.gravity.set(0, -9.82, 0) // m/s²

loadColliders(world)

// Setup ground material
const physicsMaterial = new CANNON.Material("groundMaterial")
const ballContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 1, restitution: 0.5 })
world.addContactMaterial(ballContactMaterial)

// Create balls
const ball1 = new Ball(new Transform({ position: new Vector3(7.4, 1.43, 6.7) }), physicsMaterial, world)
const ball2 = new Ball(new Transform({ position: new Vector3(7.7, 1.43, 6.7) }), physicsMaterial, world)
const ball3 = new Ball(new Transform({ position: new Vector3(8, 1.43, 6.7) }), physicsMaterial, world)
const ball4 = new Ball(new Transform({ position: new Vector3(8.3, 1.43, 6.7) }), physicsMaterial, world)
const ball5 = new Ball(new Transform({ position: new Vector3(8.6, 1.43, 6.7) }), physicsMaterial, world)

const balls: Ball[] = [ball1, ball2, ball3, ball4, ball5]

// Create coconuts
const coconut1 = new Coconut(new Transform({ position: new Vector3(7.2, 2.42, 9.535) }), physicsMaterial, world)
const coconut2 = new Coconut(new Transform({ position: new Vector3(7.6, 2.25, 9.535) }), physicsMaterial, world)
const coconut3 = new Coconut(new Transform({ position: new Vector3(8, 2.42, 9.535) }), physicsMaterial, world)
const coconut4 = new Coconut(new Transform({ position: new Vector3(8.4, 2.25, 9.535) }), physicsMaterial, world)
const coconut5 = new Coconut(new Transform({ position: new Vector3(8.8, 2.42, 9.535) }), physicsMaterial, world)
const coconuts: Coconut[] = [coconut1, coconut2, coconut3, coconut4, coconut5]

// Create a ground plane and apply physics material
const groundShape: CANNON.Plane = new CANNON.Plane()
const groundBody: CANNON.Body = new CANNON.Body({ mass: 0 })
groundBody.addShape(groundShape)
groundBody.material = physicsMaterial
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
groundBody.position.set(0, 0.05, 0)
world.addBody(groundBody) // Add ground body to world

// Controls and UI
let throwPower = 0
let powerBar = new ui.UIBar(0, -80, 80, Color4.Yellow(), ui.BarStyles.ROUNDWHITE)
let powerIcon = new ui.SmallIcon("images/powerIcon.png", -101, 85, 90, 23)
let isPowerUp = true
const POWER_UP_SPEED = 150

class PowerMeterSystem implements ISystem {
  update(dt: number): void {
    if (throwPower < 1) {
      isPowerUp = true
    } else if (throwPower > 99) {
      isPowerUp = false
    }

    if (throwPower > 0 || throwPower < 99) {
      isPowerUp ? (throwPower += dt * POWER_UP_SPEED * 1.1) : (throwPower -= dt * POWER_UP_SPEED) // Powering up is 10% faster
      powerBar.set(throwPower / 100)
      throwPower > 80 ? (powerBar.bar.color = Color4.Red()) : (powerBar.bar.color = Color4.Yellow())
    }
  }
}

let powerMeterSys: PowerMeterSystem

// Controls
Input.instance.subscribe("BUTTON_DOWN", ActionButton.POINTER, false, (e) => {
  for (let ball of balls) {
    if (ball.isActive && !ball.isThrown) {
      powerBar.bar.visible = true
      powerBar.background.visible = true
      throwPower = 1
      powerMeterSys = new PowerMeterSystem()
      engine.addSystem(powerMeterSys)
    }
  }
})

Input.instance.subscribe("BUTTON_UP", ActionButton.POINTER, false, (e) => {
  for (let ball of balls) {
    if (ball.isActive && !ball.isThrown) {
      // Strength system
      engine.removeSystem(powerMeterSys)
      powerBar.set(0)

      let throwDirection = Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
      ball.playerThrow(throwDirection, throwPower)
    }
  }
})

// Set high to prevent tunnelling
const FIXED_TIME_STEPS = 1.0 / 60
const MAX_TIME_STEPS = 10

class PhysicsSystem implements ISystem {
  update(dt: number): void {
    world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)

    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isActive) {
        balls[i].getComponent(Transform).position.copyFrom(balls[i].body.position)
        balls[i].getComponent(Transform).rotation.copyFrom(balls[i].body.quaternion)
      }
      if (balls[i].body.velocity.almostEquals(new CANNON.Vec3(0, 0, 0), 2) && balls[i].body.sleepState !== CANNON.Body.SLEEPING) {
        balls[i].glowEntity.getComponent(GLTFShape).visible = true
      }
    }
    for (let i = 0; i < coconuts.length; i++) {
      coconuts[i].getComponent(Transform).position.copyFrom(coconuts[i].body.position)
      coconuts[i].getComponent(Transform).rotation.copyFrom(coconuts[i].body.quaternion)
    }
  }
}
engine.addSystem(new PhysicsSystem())
