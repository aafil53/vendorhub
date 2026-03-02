const { Equipment } = require('./src/models');

async function standardizeEquipmentCategories() {
  try {
    const updates = [
      { old: 'Excavator', new: 'Excavators' },
      { old: 'Crane', new: 'Cranes' },
      { old: 'Forklift', new: 'Forklifts' },
      { old: 'Dozer', new: 'Bulldozers' },
      { old: 'Mixer', new: 'Concrete Pumps' }
    ];

    for (const update of updates) {
      const result = await Equipment.update(
        { category: update.new },
        { where: { category: update.old } }
      );
      console.log(`Updated ${update.old} -> ${update.new}: ${result} rows affected.`);
    }
    
    console.log('✅ Equipment categories standardized to Plural/Vendor format.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating equipment:', error);
    process.exit(1);
  }
}

standardizeEquipmentCategories();
