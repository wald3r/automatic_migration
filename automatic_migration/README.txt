Master Thesis Description

Student: Walder Daniel - 015153159

Working Title: Automatic Migration of Cloud Instances based on pricing

Idea:

Amazon Web Service has many data centres around the world and offers in every data centre various kinds of EC2 instances with different pricing depending on the needed computational power.

Overall, there are bascially 3 different types of pricing models for a single EC2 instance:

    1. On-Demand – The price doesn’t change and the customer can terminate the instance whenever they want.
    2. Reserved – Price is lower than On-Demand but the instance has to be reserved for a couple of months.
    3. Spot Instance – The price can be up to 90% lower than an equal On-Demand instance but Amazon cancels the spot instance whenever they want to. The customer can also automatically cancel the instance, when the instance gets too pricey (bid price). Prices might change hourly. 
 
The focus is on spot instances. With spot instances Amazon offers a price history and the current price. Although not the future price. 

So the idea of this thesis is to develop a framework, which is based on a prediction model, that migrates a spot instance of AWS automatically to a cheaper spot instance. In detail, the prediction model gets fed with the price history and through predictions it shall be able to determine, which equal spot instance in what data centre will be the next cheapest one. If there is a cheaper one, the framework will start a migration. Through that it might be possible to save money and make spot instances more reliable. 

Furthermore, there is no way of knowing, when Amazon will interrupt a spot instance but there might be various ways to limit the down time. Goal would be here to find a suitable way to limit the down time. 
 
Besides that, Microsoft Azure and Google Cloud offer similar instances but there are slight differences. The main focus will be on Amazon but if possible, then also the other two cloud providers shall be included. Three providers would offer more possibilities in sense of instances and latency (data centres in the same geographical regions).




Goal: 

- Save more money with spot instances through migration
- Make spot instances more reliable, through avoiding automatic cancellation by the user (bid price)
- Make spot instances more reliable, through limiting the down time caused by the provider
- Proof-of-concept that the prediction model works
- Proof theoretically that migration would save money


To do: 

- Develop a framework, which monitors the instances and migrates in case there is a cheaper instance
- Include the prediction model in the framework
- Analyse existing price history and find examples, where money could have been saved through automatic migration
- Run tests to proof that the developed framework works
- Try to integrate Microsoft Azure and Google Cloud instances
- If possible, then establish a price history for Microsoft Azure and Google Cloud to feed the prediction model with it.

Funding:

Amazon, Google and Microsoft offer Free Tier programmes, which make the instances with the lowest computational power for free in the first year. Despite that, all three providers offer student programmes, where it is possible to get around 100$ from each provider for testing reasons. 

It might be enough to run tests. Worst-case scenario might be to implement some sort of simulation mode, which does not actually request instances. 

References:

AWS: 
https://aws.amazon.com/de/ec2/spot/
https://aws.amazon.com/education/awseducate/students/

Google: 
https://cloud.google.com/compute/docs/instances/preemptible
https://edu.google.com/products/google-cloud/?modal_active=none&story-card_activeEl=for-researchers

Microsoft: 
https://azure.microsoft.com/en-us/services/virtual-machines/
https://azure.microsoft.com/en-us/free/students/


