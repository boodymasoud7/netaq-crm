const { Client, Lead, Note, Interaction } = require('../../models')
const { Op } = require('sequelize')

const getHasData = async (req, res) => {
  try {
    const { clientIds, leadIds } = req.query
    
    const response = {
      clients: {},
      leads: {}
    }

    // Process client IDs if provided
    if (clientIds) {
      const clientIdArray = clientIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      
      if (clientIdArray.length > 0) {
        // Use EXISTS queries for better performance
        const clientHasData = await Promise.all(
          clientIdArray.map(async (clientId) => {
            const [hasNotes, hasInteractions] = await Promise.all([
              Note.count({
                where: { 
                  itemType: 'client',
                  itemId: clientId
                },
                limit: 1
              }).then(count => count > 0),
              
              Interaction.count({
                where: { 
                  itemType: 'client', 
                  itemId: clientId 
                },
                limit: 1
              }).then(count => count > 0)
            ])
            
            return {
              id: clientId,
              hasNotes,
              hasInteractions
            }
          })
        )

        // Build response object
        clientHasData.forEach(({ id, hasNotes, hasInteractions }) => {
          response.clients[id] = { hasNotes, hasInteractions }
        })
      }
    }

    // Process lead IDs if provided  
    if (leadIds) {
      const leadIdArray = leadIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      
      if (leadIdArray.length > 0) {
        const leadHasData = await Promise.all(
          leadIdArray.map(async (leadId) => {
            const [hasNotes, hasInteractions] = await Promise.all([
              Note.count({
                where: { 
                  itemType: 'lead',
                  itemId: leadId
                },
                limit: 1
              }).then(count => count > 0),
              
              Interaction.count({
                where: { 
                  itemType: 'lead', 
                  itemId: leadId 
                },
                limit: 1
              }).then(count => count > 0)
            ])
            
            return {
              id: leadId,
              hasNotes,
              hasInteractions
            }
          })
        )

        leadHasData.forEach(({ id, hasNotes, hasInteractions }) => {
          response.leads[id] = { hasNotes, hasInteractions }
        })
      }
    }

    res.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('❌ Error in getHasData:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch has-data information',
      details: error.message
    })
  }
}

module.exports = {
  getHasData
}
