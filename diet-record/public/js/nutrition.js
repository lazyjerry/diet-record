const nutrientFields = ["grains", "protein", "vegetables", "fruits", "dairy", "fats"]
const calcFields = {
  calories: document.getElementById('calories'),
  carbs: document.getElementById('carbs'),
  proteins: document.getElementById('proteins'),
  fats_total: document.getElementById('fats_total'),
}

export function calcNutrition() {
  const g = (id) => parseFloat(document.getElementById(id).value || 0)
  const grains = g('grains'), protein = g('protein'), vegetables = g('vegetables')
  const fruits = g('fruits'), dairy = g('dairy'), fats = g('fats')

  const calories = grains * 70 + protein * 75 + vegetables * 25 + fruits * 60 + dairy * 85 + fats * 45
  const carbs = grains * 15 + vegetables * 5 + fruits * 15 + dairy * 12
  const proteins = grains * 2 + protein * 7 + vegetables * 1 + dairy * 8
  const fats_total = protein * 5 + fats * 5

  calcFields.calories.textContent = Math.round(calories)
  calcFields.carbs.textContent = Math.round(carbs)
  calcFields.proteins.textContent = Math.round(proteins)
  calcFields.fats_total.textContent = Math.round(fats_total)
}

export function bindNutritionEvents() {
  nutrientFields.forEach(id => {
    document.getElementById(id).addEventListener('input', calcNutrition)
  })
}

export { nutrientFields }