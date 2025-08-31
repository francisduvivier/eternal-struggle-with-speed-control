const CENTER = { x: 200, y: 200 };
const MAIN_RADIUS = 180;
const MED_RADIUS = 90;
const SMALL_RADIUS = 25;
let SHOW_POINTS = false;
let PAUSED = true;

function mousePressed() {
  SHOW_POINTS = !SHOW_POINTS;
}

function mouseMoved() {
  if (PAUSED) PAUSED = false;
}

// math
function normalize(p1) {
  const len = Math.sqrt(p1.x*p1.x + p1.y*p1.y);
  return { ...p1, x : p1.x / len, y: p1.y / len };
}

function dot(p1, p2) {
  return p1.x*p2.x + p1.y*p2.y;
}

function len(v) {
  return Math.sqrt(dot(v, v));
}

function sub(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function mult(p, s) {
  return { x: p.x * s, y: p.y * s };
}

function dista(a, b) {
  let d = createVector(a.x, a.y).dist(createVector(b.x, b.y));
  return d;
}

function distToLineSegment(item, p1, p2) {
  const l2 = dista(p1, p2) * dista(p1, p2);
  let t = dot(sub(item, p2), sub(p1, p2)) / l2;
  t = Math.max(0, Math.min(t, 1));
  return dista(item, { x: p2.x - t*(p1.x - p2.x), y: p2.y - t*(p1.y - p2.y) })
}

// shapes and physics

function arcOfPoints(cx, cy, r, fromDeg, toDeg, nPoints) {
  const points = [];
  for (let i = 1; i <= nPoints; i++) {
    const a = fromDeg + (toDeg - fromDeg) * (i / nPoints);
    points.push({ x: cx + cos(a) * r, y: cy + sin(a) * r });
  }
  return points;
}

function bounceFromCircle(c, item, itemV) {
  const directionOfHitPoint = normalize(sub(item, c));
  const normal = directionOfHitPoint;
  const v = normalize(itemV);
  const projectedVelocity = dot(normal, v);
  //const newDir = { x: v.x - 2*projectedVelocity*normal.x, y: v.y - 2*projectedVelocity*normal.y };
  const newDir = sub(v, mult(normal, 2*projectedVelocity));
  return mult(newDir, len(itemV));
}

const data = {};
function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent("sketch");
  angleMode(DEGREES);


  const blackBorder = arcOfPoints(CENTER.x, CENTER.y + MED_RADIUS, MED_RADIUS, 90, 90+180, 60);
  const whiteBorder = arcOfPoints(CENTER.x, CENTER.y - MED_RADIUS, MED_RADIUS, 90, 90-180, 60);

  // from bottom to top
  data.border = [
    ...blackBorder,
    ...whiteBorder,
  ];
  // from top to bottom
  data.whiteOuter = arcOfPoints(CENTER.x, CENTER.y, MAIN_RADIUS, 270, 270+180, 60);
  // balls
  //const vW = createVector(2,3);
  //const vB = createAVector(2,3);
  //const vW = createVector(-4,2);
  //const vB = createVector(4,-2);
  //const vW = createVector(-4,0);
  //const vB = createVector(4,-0);
  const vW = createVector(0,4);
  const vB = createVector(0,4);
  data.whiteBall = { x: CENTER.x, y: CENTER.y - MED_RADIUS, r: SMALL_RADIUS, v: vW };
  data.blackBall = { x: CENTER.x , y: CENTER.y + MED_RADIUS, r: SMALL_RADIUS, v: vB };
}

let t = 0;
function draw() {
  t++;
  render();

  if (t < 100) return;
  if (t > 105 && t < 107) return;
  if (PAUSED) return;
  collisions();
  data.whiteBall = move(data.whiteBall);
  data.blackBall = move(data.blackBall);
  // if moved to0 much, move back into the border.
  if (dista(data.whiteBall, CENTER) > MAIN_RADIUS - SMALL_RADIUS) {
    const a= atan2((data.whiteBall.y-CENTER.y), data.whiteBall.x-CENTER.x);
    const newLoc = {
      x: CENTER.x + cos(a) * (MAIN_RADIUS - SMALL_RADIUS - 1),
      y: CENTER.y + sin(a) * (MAIN_RADIUS - SMALL_RADIUS - 1),
    }
    data.whiteBall = { ...data.whiteBall, ...newLoc };
  }
  if (dista(data.blackBall, CENTER) > MAIN_RADIUS - SMALL_RADIUS) {
    const a= atan2((data.blackBall.y-CENTER.y), data.blackBall.x-CENTER.x);
    const newLoc = {
      x: CENTER.x + cos(a) * (MAIN_RADIUS - SMALL_RADIUS - 1),
      y: CENTER.y + sin(a) * (MAIN_RADIUS - SMALL_RADIUS - 1),
    }
    data.blackBall = { ...data.blackBall, ...newLoc };
  }
}

function collisions() {
  for (const b of [data.whiteBall, data.blackBall]) {
    let movedBall = move(b);
    let newV = b.v;
    let hit = false;
    const hitPoints = [];
    /*
    const newBorder = [data.border[0]];
    for (let i = 1; i < data.border.length; i++) {
      const p1 = data.border[i-1];
      const p2 = data.border[i];
      if (dista(p1, CENTER) >= MAIN_RADIUS) {
        newBorder.push(p1); 
        continue;
      }
      if (dista(p1, movedBall) < SMALL_RADIUS) {
        let movedPoint = { ...p1, x: p1.x + (newV.x*1.0), y: p1.y + (newV.y*1.0) }
        newBorder.push(movedPoint);
        hitPoints.push(p1);
        hit = true;
      } else if (distToLineSegment(movedBall, p1, p2) <= SMALL_RADIUS) {
        let midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        newBorder.push(p1);
        hitPoints.push(midPoint);
        hit = true;
      } else {
        newBorder.push(p1);
      }
    }
    newBorder.push(data.border[data.border.length-1]);
    */

    const newBorder = [];
    for (const p of data.border) {
      if (dista(p, movedBall) < SMALL_RADIUS - 4) {
        let movedPoint = { ...p, x: p.x + (newV.x*1.5), y: p.y + (newV.y*1.5) }
        if (dista(movedPoint, CENTER) >= MAIN_RADIUS) movedPoint = p; // don't move.
        newBorder.push(movedPoint);
        hitPoints.push(p);
        hit = true;
      } else {
        newBorder.push(p);
      }
    }
    
    if (dista(movedBall, CENTER) >= MAIN_RADIUS - SMALL_RADIUS) {
      newV = bounceFromCircle(CENTER, movedBall, newV);
    } else if (hit) {
      newV = bounceFromCircle(hitPoints[0], movedBall, newV);
    }
    data.border = refillBorder(newBorder);
    if (b === data.whiteBall) {
      data.whiteBall = { ...b, v: newV };
    } else {
      data.blackBall = { ...b, v: newV };
    }
  }
}

function refillBorder(points) {
  const distances = points.map((p, i) => i > 0 ? dista(p, points[i-1]) : dista(points[0], points[1]));
  const maxD = max(distances);
  const minD = min(distances);
  //console.log("mm", minD, maxD);
  if (maxD < 10) return points;
  let found = true;
  while (found) {
    found = false;
    const refilledBorder = [points[0]];
    for (let i = 1; i < points.length; i++) {
      let point = points[i];
      let prevPoint = points[i - 1];
      if (dista(point, prevPoint) > 10) {
        const mid = { x: lerp(point.x, prevPoint.x, 0.5), y: lerp(point.y, prevPoint.y, 0.5) };
        //console.log("add point", mid, "between", point, prevPoint, dista(point, mid), dista(prevPoint, mid));
        refilledBorder.push(mid);
        found = true;
        //noLoop();
      }
      refilledBorder.push(point);
    }
    points = refilledBorder;
  }
  // now prune redundant points
  const canRemove = [];
  found = true;
  while (found) {
    found = false;
    for (let i = 2; i < points.length; i++) {
      if (dista(points[i], points[i - 2]) < 4) {
        canRemove.push(i);
        found = true;
        //console.log("removing")
      }
    }
    points = points.filter((p, i) => canRemove.indexOf(i) === -1);
  }
  return points;
}

function move(item) {
  return {
    ...item,
    x: item.x + item.v.x,
    y: item.y + item.v.y,
  }
}

function render() {
  background("antiquewhite");

  fill(0);
  strokeWeight(0);
  ellipse(CENTER.x, CENTER.y, MAIN_RADIUS*2, MAIN_RADIUS*2);

  fill(255);
  stroke(255);

  beginShape();
  data.whiteOuter.forEach(({ x, y}) => vertex(x, y));
  data.border.forEach(({ x, y}) => vertex(x, y));
  endShape();


  if (SHOW_POINTS) {
    fill("red")
    data.border.forEach(({ x, y}) => ellipse(x, y, 4, 4));
    data.whiteOuter.forEach(({ x, y}) => ellipse(x, y, 4, 4));
  }


  fill("white")
  ellipse(data.whiteBall.x, data.whiteBall.y, data.whiteBall.r * 2, data.whiteBall.r * 2);
  fill("black");
  ellipse(data.blackBall.x, data.blackBall.y, data.blackBall.r * 2, data.blackBall.r * 2);
}
