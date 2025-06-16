// 建立場景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// 攝影機與渲染器
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

// 光源
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// 雷達與金幣計數
const radar = document.getElementById('radar');
const radarCtx = radar.getContext('2d');
const coinDisplay = document.getElementById('coin-counter');
let coinCount = 0;

// 飛機模型
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 12), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
body.rotation.x = Math.PI / 2;
const wing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), new THREE.MeshBasicMaterial({ color: 0x5555ff }));
wing.position.set(0, 0.3, 0);
const tail = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.5), new THREE.MeshBasicMaterial({ color: 0xff5555 }));
tail.position.set(0, 0.3, -1.2);
const airplane = new THREE.Group();
airplane.add(body, wing, tail);
scene.add(airplane);

// 重設飛機
let speed = 0;
function resetAirplane() {
  airplane.position.set(0, 2, 0);
  airplane.rotation.set(0, 0, 0);
  speed = 0;
}
resetAirplane();

// 地面與牆壁
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x228b22 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const walls = [];
function createWall(x, z, width, depth) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 10, depth), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  wall.position.set(x, 5, z);
  walls.push(wall);
  scene.add(wall);
}
createWall(0, -100, 200, 2);
createWall(0, 100, 200, 2);
createWall(-100, 0, 2, 200);
createWall(100, 0, 2, 200);

// 樹木與金幣
let obstacles = [], coins = [];
function createTree(x, z) {
  const trunkHeight = 5;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, trunkHeight, 12), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
  trunk.position.set(x, trunkHeight / 2, z);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
  leaves.position.set(x, trunkHeight + 1.5, z);
  const tree = new THREE.Group();
  tree.add(trunk, leaves);
  obstacles.push(tree);
  scene.add(tree);
}
function createCoin(x, z) {
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.3, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
  coin.rotation.x = Math.PI / 2;
  coin.position.set(x, 1, z);
  coins.push(coin);
  scene.add(coin);
}
function clearMaze() {
  obstacles.forEach(o => scene.remove(o));
  coins.forEach(c => scene.remove(c));
  obstacles = [];
  coins = [];
  scene.remove(goal);
}
function generateMaze(rows = 20, cols = 20, spacing = 10) {
  for (let i = -cols / 2; i < cols / 2; i++) {
    for (let j = -rows / 2; j < rows / 2; j++) {
      const x = i * spacing, z = j * spacing;
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
      if (Math.random() < 0.4) createTree(x, z);
      else if (Math.random() < 0.2) createCoin(x, z);
    }
  }
  createGoal(); // 重新生成終點
}

// 終點
let goal;
function createGoal() {
  const gx = Math.floor(Math.random() * 60 + 30);
  const gz = Math.floor(Math.random() * 60 + 30);
  const goalBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  goalBase.position.set(gx, 0.5, gz);
  const goalStick = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 12), new THREE.MeshStandardMaterial({ color: 0x8B0000 }));
  goalStick.position.set(gx, 6, gz);
  const goalFlag = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.2), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
  goalFlag.position.set(gx + 5, 9, gz);
  goal = new THREE.Group();
  goal.add(goalBase, goalStick, goalFlag);
  scene.add(goal);
}
generateMaze();

// 控制
const maxSpeed = 0.2;
const keyState = {};
window.addEventListener("keydown", e => keyState[e.code] = true);
window.addEventListener("keyup", e => keyState[e.code] = false);

// 雷達顯示
function drawRadar() {
  radarCtx.clearRect(0, 0, radar.width, radar.height);
  const scale = 0.6, cx = radar.width / 2, cy = radar.height / 2;
  radarCtx.fillStyle = 'lime';
  radarCtx.beginPath();
  radarCtx.arc(cx + airplane.position.x * scale, cy + airplane.position.z * scale, 5, 0, 2 * Math.PI);
  radarCtx.fill();
  radarCtx.fillStyle = 'green';
  for (let obs of obstacles) {
    const pos = obs.children[0].position;
    radarCtx.beginPath();
    radarCtx.arc(cx + pos.x * scale, cy + pos.z * scale, 2, 0, 2 * Math.PI);
    radarCtx.fill();
  }
  radarCtx.fillStyle = 'red';
  if (goal) {
    const gp = goal.children[0].position;
    radarCtx.beginPath();
    radarCtx.arc(cx + gp.x * scale, cy + gp.z * scale, 4, 0, 2 * Math.PI);
    radarCtx.fill();
  }
  radarCtx.strokeStyle = 'white';
  radarCtx.strokeRect(0, 0, radar.width, radar.height);
}

// 碰撞
function checkCollision() {
  const airplaneBox = new THREE.Box3().setFromObject(airplane);
  for (let obs of obstacles) {
    if (airplaneBox.intersectsBox(new THREE.Box3().setFromObject(obs))) {
      alert("💥 撞到樹木，遊戲結束！");
      resetAirplane();
      return;
    }
  }
  if (goal && airplaneBox.intersectsBox(new THREE.Box3().setFromObject(goal))) {
    alert("🎉 通關成功！進入下一關！");
    clearMaze();
    resetAirplane();
    generateMaze();
    return;
  }
  for (let wall of walls) {
    if (airplaneBox.intersectsBox(new THREE.Box3().setFromObject(wall))) {
      alert("💥 撞到牆壁，遊戲結束！");
      resetAirplane();
      return;
    }
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    if (airplaneBox.intersectsBox(new THREE.Box3().setFromObject(coins[i]))) {
      scene.remove(coins[i]);
      coins.splice(i, 1);
      coinCount++;
      coinDisplay.innerText = `金幣：${coinCount}`;
    }
  }
}

// 主動畫
function animate() {
  requestAnimationFrame(animate);
  if (keyState["ArrowLeft"]) airplane.rotation.y += 0.03;
  if (keyState["ArrowRight"]) airplane.rotation.y -= 0.03;
  if (keyState["ArrowUp"]) airplane.position.y = Math.min(airplane.position.y + 0.1, 8);
  if (keyState["ArrowDown"]) airplane.position.y = Math.max(airplane.position.y - 0.1, 1);
  if (keyState["Space"]) speed = Math.min(speed + 0.002, maxSpeed);
  else speed = Math.max(speed - 0.002, 0);
  const direction = new THREE.Vector3();
  airplane.getWorldDirection(direction);
  direction.negate();
  airplane.position.addScaledVector(direction, speed);
  const offset = direction.clone().multiplyScalar(-10);
  offset.y = 5;
  camera.position.copy(airplane.position.clone().add(offset));
  camera.lookAt(airplane.position);
  wing.rotation.z = Math.sin(Date.now() * 0.005) * 0.1;
  renderer.render(scene, camera);
  drawRadar();
  checkCollision();
}
animate();